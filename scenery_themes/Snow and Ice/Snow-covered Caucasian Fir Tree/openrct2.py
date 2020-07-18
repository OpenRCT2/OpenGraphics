bl_info = {
    "name": "OpenRCT2 Add-on",
    "blender": (2, 83, 0),
    "category": "Object",
}

import bpy
import mathutils
import subprocess
from math import radians

class SimpleOperator(bpy.types.Operator):
    """Tooltip"""
    bl_idname = "objects.test"
    bl_label = "Render"

    #@classmethod
    #def poll(cls, context):
        #return 0

    def execute(self, context):
        #set the output path
        
        #set the cursor at the center of the world
        bpy.context.scene.cursor.location = mathutils.Vector((0,0,0))
        
        #find the origin object
        collection = bpy.data.collections['Rig']
        rigOrigin = collection.all_objects['RigOrigin']
        
        outputPath = bpy.path.abspath("//output\\")
        palette = bpy.path.abspath("//palettes\\")
        paletteFile = palette + "WTRCYAN.bmp"
        
        
        #rotate 90 degrees all objects in rig
        for index in range(4):
            bpy.data.scenes[0].render.filepath = bpy.path.abspath("//output//" + str(index) + ".png")
            bpy.ops.render.render(write_still=True)
            rigOrigin.rotation_euler[2] += radians(90)
        
        for index in range(4):
            filePath = outputPath + str(index) + ".png"
            mask = outputPath + "mask.png"
            outputFile = outputPath + str(index) + ".bmp"
            args = []
            args.append("magick.exe")
            args.append(filePath)
            args.append("-background")
            args.append("'sRGB(57,59,57)'")
            args.append("-alpha")
            args.append("Extract")
            args.append(mask)
            subprocess.call(args)
            
            args = []
            args.append("magick.exe")
            args.append(filePath)
            args.append("-background")
            args.append("'sRGB(57,59,57)'")
            args.append("-alpha")
            args.append("Remove")
            args.append(filePath)
            subprocess.call(args)
            
            args = []
            args.append("magick.exe")
            args.append("convert")
            mask = outputPath + "mask.png"
            args.append(mask)
            args.append("-threshold")
            args.append("50%")
            args.append(mask)
            subprocess.call(args)
            
            args = []
            args.append("magick.exe")
            args.append("composite")
            args.append("-compose")
            args.append("multiply")
            mask = outputPath + "mask.png"
            args.append(mask)
            args.append(filePath)
            args.append(filePath)
            subprocess.call(args)
            
            args = []
            args.append("magick.exe")
            args.append(filePath)
            args.append("-fuzz")
            args.append("0%")
            args.append("-opaque")
            args.append("'sRGB(57,59,57)'")
            args.append(filePath)
            subprocess.call(args)
            
            args = []
            args.append("magick.exe")
            args.append(filePath)
            args.append("-trim")
            args.append("-dither")
            args.append("FloydSteinberg")
            args.append("-define")
            args.append("dither:diffusion-amount=30%")
            args.append("-remap")
            args.append(paletteFile)
            args.append(outputFile)
            subprocess.call(args)
            
            
        return {'FINISHED'}

class HelloWorldPanel(bpy.types.Panel):
    """Creates a Panel in the Object properties window"""
    bl_label = "OpenRCT2 Render"
    bl_idname = "panel.OpenRCT2"
    bl_space_type = 'PROPERTIES'
    bl_region_type = 'WINDOW'
    bl_context = "render"
    

    def draw(self, context):
        self.layout.operator("objects.test",text="Render OpenRCT2")
        


def register():
    bpy.utils.register_class(SimpleOperator)
    bpy.utils.register_class(HelloWorldPanel)
    


def unregister():
    bpy.utils.unregister_class(HelloWorldPanel)
    bpy.utils.unregister_class(SimpleOperator)


if __name__ == "__main__":
    register()