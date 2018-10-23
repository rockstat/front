
bump-patch:
	bumpversion patch

bump-minor:
	bumpversion minor

build:
	docker build -t front .

push-latest:
	docker tag front rockstat/front:latest
	docker push rockstat/front:latest

push-dev:
	docker tag front rockstat/front:dev
	docker push rockstat/front:latest
