
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

travis-trigger:
	curl -vv -s -X POST \
		-H "Content-Type: application/json" \
		-H "Accept: application/json" \
		-H "Travis-API-Version: 3" \
		-H "Authorization: token $$TRAVIS_TOKEN" \
		-d '{ "request": { "branch":"$(br)" }}' \
		https://api.travis-ci.com/repo/$(subst $(DEL),$(PERCENT)2F,$(repo))/requests
