var sceneSettings = {
	"scene_name" : "scene_specularImageADJ.json",
	"scene_path" : "assets/scene_specularImageADJ.json",
	"models" : [
		{
			"name" : "XSModel",
			"scene_object": "artemixXSMesh.js",
			"product_type" : "Shells",
			"maps": ["normalXS", "specularXS"],
            "textures" : [],
            "rotation": "20"
	    },
		{
			"name" : "3XLModel",
			"scene_object": "artemix3XLMesh.js",
			"product_type" : "Shells",
			"maps" : ["normal3XL", "specular3XL"],
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
			"name" : "normalXS",
			"type" : "normal",
			"file" : "assets/maps/viewer_XS_2k_normal.jpg"
		},
		{
			"name" : "normal3XL",
			"type" : "normal",
			"file" : "assets/maps/viewer_3XL_2k_normal.jpg"
		},
		{
			"name" : "specularXS",
			"type" : "specular",
			"file" : "assets/maps/viewer_XS_2k_specular.jpg"
		},
		{
			"name" :"specular3XL",
			"type" : "specular",
			"file" : "assets/maps/viewer_3XL_2k_specular.jpg"
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