var sceneSettings = {
	"scene_name" : "artemixNoSeam.json",
	"scene_path" : "assets/artemixNoSeam.json",
	"models" : [
		{
			"name" : "XSModel",
			"scene_object": "artemixXS.js",
			"product_type" : "Shells",
			"maps" : ["normalXS", "gloss512"],
			"textures" : [],
			"rotation" : "20"
		},
		{
			"name" : "WWBXSModel",
			"scene_object": "artemixXS_noSeam.js",
			"product_type" : "Shells",
			"maps" : ["wide_waistband_normalXS", "gloss512"],
			"textures" : [],
			"rotation" : "20"
		},
		{
			"name" : "WWB3XLModel",
			"scene_object": "artemix3XL_noSeam.js",
			"product_type" : "Shells",
			"maps" : ["wide_waistband_normal3XL", "gloss512"],
			"textures" : [],
			"rotation" : "20"
		}
	],
	"lighting" : [
		{
			"name" : "defaultLighting",
			"scene_object":  "MidDesignLights"
		},
		{
			"name" : "lightDesignLights",
			"scene_object" : "BrightDesignLights",
			"specular_color" : "0x202020"
		},
		{
			"name" : "darkDesignLights",
			"scene_object" : "DarkDesignLights",
			"specular_color" : "0xa5a4a6"
		}
	],
	"maps" : [
		{
           "name" : "gloss512",
           "type" : "specular",
           "file" : "assets/maps/gloss_512.png"
		},
		{
			"name": "wide_waistband_normal3XL",
			"type": "normal",
			"file": "assets/maps/3XLWWB_2k_norm.png"
		},
		{
			"name": "wide_waistband_normalXS",
			"type": "normal",
			"file": "assets/maps/XSWWB_2k_norm.png"
		}
	],
	"textures" : [
		{ "name": "Azalea",
		  "swappable" : true,
		  "file" : "assets/Azalea-V1S13-01.jpg",
		  "lighting" : "defaultLighting"	
		},
		{ "name": "Bismuth",
		  "swappable" : true,
		  "file" : "assets/Bismuth-V1S12-Grey-01.jpg",
		  "lighting" : "darkDesignLights"	
		},
	]
}