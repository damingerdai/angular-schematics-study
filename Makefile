schematics:
	cd hello-world && npm run build && cd ..

generate: schematics
	cd web-app && ng generate ../hello-world/src/collection.json:hello-world feature/arthur-ming --dryRun=true && cd ..