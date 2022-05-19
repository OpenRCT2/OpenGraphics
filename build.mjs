#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { platform } from 'os';

const verbose = process.argv.indexOf('--verbose') != -1;

async function main() {
    const objects = [];
    for (const dir of ['rct2', 'openrct2']) {
        const moreObjects = await getObjects(dir);
        objects.push(...moreObjects);
    }

    // Process all objects with gx files first before those with .png files
    objects.sort((a, b) => {
        if (typeof a.images === typeof b.images) return 0;
        if (typeof a.images === 'string') return -1;
        return 1;
    });

    await mkdir('out');
    await mkdir('temp');

    const manifest = await readJsonFile('manifest.json');
    manifest.objects = [];
    const singleSpriteManifest = [];
    const gxMergeList = [];
    let imageIndex = 0;
    for (const obj of objects) {
        console.log(`Processing ${obj.id}...`);

        let numImages;
        const images = obj.images;

        if (typeof images === 'string') {
            const result = images.match(/^\$LGX:(.+)\[([0-9]+)\.\.([0-9]+)\]$/);
            if (result) {
                const fileName = result[1];
                const index = parseInt(result[2]);
                const length = parseInt(result[3]);
                gxMergeList.push(path.join(obj.cwd, fileName));
                numImages = length - index + 1;
            } else {
                const result = images.match(/^\$LGX:(.+)$/);
                if (result) {
                    const fileName = result[1];
                    const fullPath = path.join(obj.cwd, fileName);
                    gxMergeList.push(fullPath);
                    numImages = await getGxImageCount('out', fullPath);
                } else {
                    throw new Error(`Unsupported image format: ${images}`);
                }
            }
        } else {
            for (const image of images) {
                image.path = path.join(obj.cwd, image.path);
            }
            singleSpriteManifest.push(...images);
            numImages = images.length;
        }

        obj.images = `$LGX:images.dat[${imageIndex}..${imageIndex + numImages - 1}]`;
        obj.cwd = undefined;
        manifest.objects.push(obj);
        imageIndex += numImages;
    }
    gxMergeList.push('images.dat');

    console.log(`Building asset pack...`);
    await writeJsonFile('temp/manifest.json', manifest);
    await writeJsonFile('temp/images.json', singleSpriteManifest);
    await compileGx('temp', 'images.json', 'images.dat');
    if (gxMergeList.length >= 2) {
        await mergeGx('temp', gxMergeList, 'images.dat');
    }

    const outFilename = `${manifest.id}.parkap`
    const outPath = path.join('../out/', outFilename);
    await zip('temp', outPath, ['manifest.json', 'images.dat']);
    rm('temp');
    console.log(`${outFilename} created successfully`);
}

async function getObjects(dir) {
    const result = [];
    const files = await getAllFiles(dir);
    for (const file of files) {
        const jsonRegex = /^.+\..+\.json$/;
        if (jsonRegex.test(file)) {
            const cwd = path.join('..', path.dirname(file));
            const obj = await readJsonFile(file);
            obj.cwd = cwd;
            result.push(obj);
        }
    }
    return result;
}

function compileGx(cwd, manifest, outputFile) {
    return startProcess('gxc', ['build', outputFile, manifest], cwd);
}

async function mergeGx(cwd, inputFiles, outputFile) {
    await startProcess('gxc', ['merge', outputFile, inputFiles[inputFiles.length - 2], inputFiles[inputFiles.length - 1]], cwd);
    for (let i = inputFiles.length - 3; i >= 0; i--) {
        await startProcess('gxc', ['merge', outputFile, inputFiles[i], outputFile], cwd);
    }
}

async function getGxImageCount(cwd, inputFile) {
    const stdout = await startProcess('gxc', ['details', inputFile], cwd);
    const result = stdout.match(/numEntries: ([0-9]+)/);
    if (result) {
        return parseInt(result[1]);
    } else {
        throw new Error(`Unable to get number of images for gx file: ${inputFile}`);
    }
}

function readJsonFile(path) {
    return new Promise((resolve, reject) => {
        fs.readFile(path, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(JSON.parse(data));
            }
        });
    });
}

function writeJsonFile(path, data) {
    return new Promise((resolve, reject) => {
        const json = JSON.stringify(data, null, 4) + '\n';
        fs.writeFile(path, json, 'utf8', err => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

function zip(cwd, outputFile, paths) {
    if (platform() == 'win32') {
        return startProcess('7z', ['a', '-tzip', outputFile, ...paths], cwd);
    } else {
        return startProcess('zip', [outputFile, ...paths], cwd);
    }
}

function startProcess(name, args, cwd) {
    return new Promise((resolve, reject) => {
        const options = {};
        if (cwd) options.cwd = cwd;
        if (verbose) {
            console.log(`Launching \"${name} ${args.join(' ')}\"`);
        }
        const child = spawn(name, args, options);
        let stdout = '';
        child.stdout.on('data', data => {
            stdout += data;
        });
        child.stderr.on('data', data => {
            stdout += data;
        });
        child.on('error', err => {
            if (err.code == 'ENOENT') {
                reject(new Error(`${name} was not found`));
            } else {
                reject(err);
            }
        });
        child.on('close', code => {
            if (code !== 0) {
                reject(new Error(`${name} failed:\n${stdout}`));
            } else {
                resolve(stdout);
            }
        });
    });
}

function mkdir(path) {
    return new Promise((resolve, reject) => {
        fs.access(path, (error) => {
            if (error) {
                fs.mkdir(path, err => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    });
}

function getAllFiles(root) {
    return new Promise((resolve, reject) => {
        const results = [];
        let pending = 0;
        const find = (root) => {
            pending++;
            fs.readdir(root, (err, fileNames) => {
                // if (err) {
                //     reject(err);
                // }
                for (const fileName of fileNames) {
                    const fullPath = path.join(root, fileName);
                    pending++;
                    fs.stat(fullPath, (err, stat) => {
                        // if (err) {
                        //     reject(err);
                        // }
                        if (stat) {
                            if (stat.isDirectory()) {
                                find(fullPath);
                            } else {
                                results.push(fullPath);
                            }
                        }
                        pending--;
                        if (pending === 0) {
                            resolve(results);
                        }
                    });
                }
                pending--;
                if (pending === 0) {
                    resolve(results.sort());
                }
            });
        };
        find(root);
    });
}

function rm(filename) {
    if (verbose) {
        console.log(`Deleting ${filename}`)
    }
    return new Promise((resolve, reject) => {
        fs.stat(filename, (err, stat) => {
            if (err) {
                if (err.code == 'ENOENT') {
                    resolve();
                } else {
                    reject();
                }
            } else {
                if (stat.isDirectory()) {
                    fs.rm(filename, { recursive: true }, err => {
                        if (err) {
                            reject(err);
                        }
                        resolve();
                    });
                } else {
                    fs.unlink(filename, err => {
                        if (err) {
                            reject(err);
                        }
                        resolve();
                    });
                }
            }
        });
    });
}

try {
    await main();
} catch (err) {
    console.log(err.message);
    process.exitCode = 1;
}
