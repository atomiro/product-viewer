var sceneSettings = {
	"scene_name" : "viewer_noSeamNoScale.json",
	"scene_path" : "assets/viewer_noSeamNoScale.json",
	"models" : [
	    {
	    	"name" : "BlackXS",
	    	"scene_object": "artemixXS_noSeamV2.js",
	    	"product_type" : "Shells",
	    	"maps" : ["wide_waistband_normalXS", "gloss512"],
	    	"color": "0x000000",
	    	"lighting": "darkDesignLights"
	    },
		{
			"name" : "XSModel",
			"scene_object": "artemixXS_noSeamV2.js",
			"product_type" : "Shells",
			"maps" : ["normalXS", "gloss512"],
			"textures" : [],
			"rotation" : "20"
		},
		{
			"name" : "WWBXSModel",
			"scene_object": "artemixXS_noSeamV2.js",
			"product_type" : "Shells",
			"maps" : ["wide_waistband_normalXS", "gloss512"],
			"textures" : [],
			"rotation" : "20"
		},
		{
			"name" : "WWB3XLModel",
			"scene_object": "artemix3XL_noSeamV3.js",
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
			"file": "assets/maps/viewer_WWB3XL_2k_norm_ridge.jpg"
		},
		{
			"name": "wide_waistband_normalXS",
			"type": "normal",
			"file": "assets/maps/viewer_WWBXS_2k_norm_ridge.jpg"
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