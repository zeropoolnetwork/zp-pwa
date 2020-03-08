docker rm -f docker-nginx
docker run --name docker-nginx -p 80:80 -d -v $(pwd)/dist/zp-pwa:/usr/share/nginx/html nginx
