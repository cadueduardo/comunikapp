# CORS no Nginx (VPS) – sair da tela de login

Se o login em produção falha com erro de CORS mesmo com o backend atualizado, o navegador pode estar recebendo a resposta do **Nginx** (ou de um erro antes de chegar ao Nest). Configurar CORS no Nginx garante que todas as respostas de `api.comunikapp.com.br` tenham os headers corretos.

## 1. Onde está o Nginx

No VPS, o config costuma estar em:

- `/etc/nginx/nginx.conf`
- ou em `/etc/nginx/sites-available/` (ex.: `default` ou `comunikapp`) e ativado em `sites-enabled`.

## 2. Map no bloco `http`

Edite o arquivo que declara o `http { }` (em geral `nginx.conf`) e **dentro** de `http { }` adicione:

```nginx
map $http_origin $cors_origin {
    default "";
    "https://comunikapp.com.br" "https://comunikapp.com.br";
    "https://www.comunikapp.com.br" "https://www.comunikapp.com.br";
}
```

## 3. Incluir o snippet CORS no `server` da API

No `server { }` que tem `server_name api.comunikapp.com.br;`, inclua o snippet **antes** do `location /` (ou do bloco que faz `proxy_pass` para o backend):

```nginx
server {
    server_name api.comunikapp.com.br;
    # ... outras diretivas (ssl, etc.) ...

    include /opt/comunikapp/docs/nginx-cors-api.conf;

    location / {
        proxy_pass http://127.0.0.1:4000;   # ajuste a porta se for outra
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Ajuste o caminho em `include` se o projeto estiver em outro diretório (ex.: `/home/cadu/comunikapp/docs/nginx-cors-api.conf`).

## 4. Testar e recarregar

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 5. Conferir no navegador

1. Abra https://comunikapp.com.br e tente fazer login.
2. No DevTools (F12) → Aba **Network** → requisição para `api.comunikapp.com.br/lojas/login` (ou `/api/lojas/login`):
   - Na resposta deve aparecer `Access-Control-Allow-Origin: https://comunikapp.com.br`.

Se a rota da API tiver prefixo (ex. `/api`), a URL será `https://api.comunikapp.com.br/api/lojas/login`; o snippet CORS aplica-se a todo o `server` da API, então continua valendo.

## 6. Se não usar include

Se preferir não usar o arquivo, copie o conteúdo do bloco **PASSO 2** de `docs/nginx-cors-api.conf` (o `if ($request_method = 'OPTIONS')` e os `add_header`) para dentro do `server { }` da API. O **map** (PASSO 1) continua obrigatório no `http { }`.
