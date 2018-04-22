
## Dev server

    consul agent -ui -dev -advertise 127.0.0.1
    -bootstrap-expect=3 
    -advertise 127.0.0.1
      -bind=192.168.1.42
      --net=host 
      

    docker run \
      -d --name=consul \
      -p 127.0.0.1:8300-8302:8300-8302 -p 127.0.0.1:8500:8500 -p 127.0.0.1:8600:8600 \
      -e CONSUL_LOCAL_CONFIG='{
        "datacenter":"us_west",
        "server":true,
        "enable_debug":true
        }' \
      consul agent -server -ui -dev  -client=0.0.0.0
    


