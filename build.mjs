#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

async function main() {
    const manifest = await readJsonFile('manifest.json');
    manifest.objects = [];

    const singleSpriteManifest = [];

    const files = await getAllFiles('rct2');
    let imageIndex = 0;
    for (const file of files) {
        if (file.endsWith('.json')) {
            const cwd = path.join('..', path.dirname(file));

            const obj = await readJsonFile(file);
            const images = obj.images;
            for (const image of images) {
                image.path = path.join(cwd, image.path);
            }
            singleSpriteManifest.push(...images);
            obj.images = `images.dat[${imageIndex}..${imageIndex + images.length - 1}]`;
            manifest.objects.push(obj);
            imageIndex += images.length;
        }
    }

    await mkdir('out');
    await writeJsonFile('out/object.json', manifest);
    await writeJsonFile('out/images.json', singleSpriteManifest);
    await compileGx('out/images.json', 'out/images.dat');
    await zip('out', 'openrct2.asset_pack.opengraphics.parkap', ['object.json', 'images.dat']);
}

function compileGx(manifest, outputFile) {
    return startProcess('gxc', ['build', outputFile, manifest]);
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
    return startProcess('zip', [outputFile, ...paths], cwd)
}

function startProcess(name, args, cwd) {
    return new Promise((resolve, reject) => {
        const options = {};
        if (cwd) options.cwd = cwd;
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
                reject(new Error(`${name} not found`));
            } else {
                reject(err);
            }
        });
        child.on('close', code => {
            if (code !== 0) {
                reject(new Error(`${name} failed:\n${stdout}`));
            } else {
                resolve(code);
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

try {
    await main();
} catch (err) {
    console.log(err.message);
    process.exitCode = 1;
}
