bump-patch:
	bumpversion patch

bump-minor:
	bumpversion minor

build:
	docker build -t front .

build_amd64:
	docker buildx build --platform linux/amd64 -t front .	

tag-ng:
	docker tag front rockstat/front:ng

tag-latest:
	docker tag front rockstat/front:latest

push-latest:
	docker push rockstat/front:latest

push-ng:
	docker push rockstat/front:ng

all-ng: build_amd64 tag-ng push-ng

push-dev:
	docker tag front rockstat/front:dev
	docker push rockstat/front:dev

to_master:
	@echo $(BR)
	git checkout master && git merge $(BR) && git checkout $(BR)

travis-trigger:
	curl -vv -s -X POST \
		-H "Content-Type: application/json" \
		-H "Accept: application/json" \
		-H "Travis-API-Version: 3" \
		-H "Authorization: token $$TRAVIS_TOKEN" \
		-d '{ "request": { "branch":"$(br)" }}' \
		https://api.travis-ci.com/repo/$(subst $(DEL),$(PERCENT)2F,$(repo))/requests
