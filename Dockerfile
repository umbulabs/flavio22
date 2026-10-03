FROM nginx:1.27-alpine

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html dbMolduras.js /usr/share/nginx/html/
COPY assets /usr/share/nginx/html/assets
COPY imagens /usr/share/nginx/html/imagens
COPY scripts /usr/share/nginx/html/scripts
COPY styles /usr/share/nginx/html/styles

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1/ || exit 1

