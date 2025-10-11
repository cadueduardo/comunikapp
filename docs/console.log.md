[dev:backend] [Nest] 11420  - 11/10/2025, 14:30:39     LOG [NestApplication] Nest application successfully started +845ms
[dev:backend] ✅ Servidor iniciado com sucesso na porta: 4000
[dev:backend] 🌐 Acesse: http://localhost:4000
[dev:frontend]  GET /os/cmgmj3n740004w4hsud1bzls4?tab=arte-aprovacao 200 in 869ms
[dev:backend] [Nest] 11420  - 11/10/2025, 14:30:46     LOG [OSPermissionsGuard] Object(6) {
[dev:backend]   evento: 'ACESSO_AUTORIZADO_OS',
[dev:backend]   usuario_id: 'tfdlzxwcx',
[dev:backend]   funcao: 'ADMINISTRADOR',
[dev:backend]   acao: 'VISUALIZAR',
[dev:backend]   etapa: undefined,
[dev:backend]   timestamp: '2025-10-11T17:30:46.072Z'
[dev:backend] }
[dev:backend] [Nest] 11420  - 11/10/2025, 14:30:46     LOG [OSPermissionsGuard] Object(6) {
[dev:backend]   evento: 'ACESSO_AUTORIZADO_OS',
[dev:backend]   usuario_id: 'tfdlzxwcx',
[dev:backend]   funcao: 'ADMINISTRADOR',
[dev:backend]   acao: 'VISUALIZAR',
[dev:backend]   etapa: undefined,
[dev:backend]   timestamp: '2025-10-11T17:30:46.100Z'
[dev:backend] }
[dev:frontend]  GET /favicon.ico?favicon.45db1c09.ico 200 in 407ms
[dev:frontend]  GET /api/os/prazo/cmgmj3n740004w4hsud1bzls4/status 200 in 362ms
[dev:backend] [Nest] 11420  - 11/10/2025, 14:30:46     LOG [OSPermissionsGuard] Object(6) {
[dev:backend]   evento: 'ACESSO_AUTORIZADO_OS',
[dev:backend]   usuario_id: 'tfdlzxwcx',
[dev:backend]   funcao: 'ADMINISTRADOR',
[dev:backend]   acao: 'VISUALIZAR',
[dev:backend]   etapa: undefined,
[dev:backend]   timestamp: '2025-10-11T17:30:46.581Z'
[dev:backend] }
[dev:frontend] 🔍 [API Route] Listando versões da OS: cmgmj3n740004w4hsud1bzls4
[dev:frontend]  GET /api/os/cmgmj3n740004w4hsud1bzls4 200 in 403ms
[dev:backend] 📋 [Controller] Listando versões da OS: { osId: 'cmgmj3n740004w4hsud1bzls4', lojaId: 'tisruw9j7' }
[dev:backend] 🔍 Buscando versões da OS: { osId: 'cmgmj3n740004w4hsud1bzls4', lojaId: 'tisruw9j7' }
[dev:backend] 📋 Encontradas 1 versões
[dev:frontend] ✅ [API Route] 1 versões encontradas
[dev:frontend]  GET /api/arte-aprovacao/versoes/os/cmgmj3n740004w4hsud1bzls4 200 in 429ms
[dev:backend] [Nest] 11420  - 11/10/2025, 14:30:46     LOG [OSPermissionsGuard] Object(6) {
[dev:backend]   evento: 'ACESSO_AUTORIZADO_OS',
[dev:backend]   usuario_id: 'tfdlzxwcx',
[dev:backend]   funcao: 'ADMINISTRADOR',
[dev:backend]   acao: 'VISUALIZAR',
[dev:backend]   etapa: undefined,
[dev:backend]   timestamp: '2025-10-11T17:30:46.938Z'
[dev:backend] }
[dev:frontend] 🔍 [API Route] Listando versões da OS: cmgmj3n740004w4hsud1bzls4
[dev:frontend]  GET /api/os/prazo/cmgmj3n740004w4hsud1bzls4/status 200 in 325ms
[dev:frontend]  GET /api/os/cmgmj3n740004w4hsud1bzls4 200 in 319ms
[dev:backend] 📋 [Controller] Listando versões da OS: { osId: 'cmgmj3n740004w4hsud1bzls4', lojaId: 'tisruw9j7' }
[dev:backend] 🔍 Buscando versões da OS: { osId: 'cmgmj3n740004w4hsud1bzls4', lojaId: 'tisruw9j7' }
[dev:backend] 📋 Encontradas 1 versões
[dev:frontend] ✅ [API Route] 1 versões encontradas
[dev:frontend]  GET /api/arte-aprovacao/versoes/os/cmgmj3n740004w4hsud1bzls4 200 in 300ms
[dev:frontend]  GET /api/arte-aprovacao/versoes/os/cmgmj3n740004w4hsud1bzls4 401 in 159ms
[dev:frontend]  GET /api/arte-aprovacao/versoes/os/cmgmj3n740004w4hsud1bzls4 401 in 145ms
[dev:frontend]  ○ Compiling /api/arte-aprovacao/comentarios/versao/[versaoId] ...
[dev:frontend]  ✓ Compiled /api/arte-aprovacao/comentarios/versao/[versaoId] in 778ms
[dev:frontend] Error: Route "/api/arte-aprovacao/comentarios/versao/[versaoId]" used `params.versaoId`. `params` should be awaited before using its properties. Learn more: https://nextjs.org/docs/messages/sync-dynamic-apis
[dev:frontend]     at GET (src\app\api\arte-aprovacao\comentarios\versao\[versaoId]\route.ts:8:12)
[dev:frontend]    6 | ) {
[dev:frontend]    7 |   try {
[dev:frontend] >  8 |     const { versaoId } = params;
[dev:frontend]      |            ^
[dev:frontend]    9 |
[dev:frontend]   10 |     const response = await fetch(`${process.env.BACKEND_URL}/arte-aprovacao/comentarios/versao/${versaoId}`, {
[dev:frontend]   11 |       method: 'GET',
[dev:frontend] 📥 [API Route] Download de arquivo: {
[dev:frontend]   versaoId: 'cmgmjqd6d0001w450acodyosh',
[dev:frontend]   filename: '1760203528025-303313805-thumb_video.jpg'
[dev:frontend] }
[dev:backend] 📥 [Controller] Download de arquivo: {
[dev:backend]   versaoId: 'cmgmjqd6d0001w450acodyosh',
[dev:backend]   filename: '1760203528025-303313805-thumb_video.jpg'
[dev:backend] }
[dev:frontend]  GET /api/arte-aprovacao/comentarios/versao/cmgmjqd6d0001w450acodyosh 200 in 2277ms
[dev:frontend]  GET /api/arte-aprovacao/versoes/cmgmjqd6d0001w450acodyosh/arquivos/download/1760203528025-303313805-thumb_video.jpg?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZmRsenh3Y3giLCJlbWFpbCI6ImNsaWVudGVzLmNhZHVlZHVhcmRvQGdtYWlsLmNvbSIsImxvamFfaWQiOiJ0aXNydXc5ajciLCJmdW5jYW8iOiJBRE1JTklTVFJBRE9SIiwibm9tZV9jb21wbGV0byI6IkNBUkxPUyBFRFVBUkRPIERPUyBTQU5UT1MiLCJsb2phIjp7ImlkIjoidGlzcnV3OWo3IiwiZW1haWwiOiJjbGllbnRlcy5jYWR1ZWR1YXJkb0BnbWFpbC5jb20iLCJzdGF0dXMiOiJBVElWTyIsImFzc2luYXR1cmFfYXRpdmEiOmZhbHNlLCJhdHVhbGl6YWRvX2VtIjoiMjAyNS0wOS0yNlQxODo0ODozNi40MzFaIiwiY2FiZWNhbGhvX29yY2FtZW50byI6bnVsbCwiY25waiI6IjQ1NDQ1NDU0NTQ1NDUiLCJjcGYiOm51bGwsImNyaWFkb19lbSI6IjIwMjUtMDktMjZUMTg6NDg6MzYuNDM1WiIsImN1c3RvX21hb2Rlb2JyYV9ob3JhIjpudWxsLCJjdXN0b19tYXF1aW5hcmlhX2hvcmEiOm51bGwsImN1c3Rvc19pbmRpcmV0b3NfbWVuc2FpcyI6bnVsbCwiZGF0YV9pbmljaW9fdHJpYWwiOiIyMDI1LTA5LTI2VDE4OjQ4OjQ3Ljg0NVoiLCJpbXBvc3Rvc19wYWRyYW8iOm51bGwsImxvZ29fdXJsIjpudWxsLCJtYXJnZW1fbHVjcm9fcGFkcmFvIjpudWxsLCJub21lIjoiQ29ydGUgVG90YWwiLCJzdHJpcGVfY3VzdG9tZXJfaWQiOm51bGwsInRlbGVmb25lIjoiMTE5NzI3NjMyMjgiLCJ0cmlhbF9yZXN0YW50ZV9kaWFzIjozMCwiaG9yYXNfcHJvZHV0aXZhc19tZW5zYWlzIjozNTJ9LCJpYXQiOjE3NjAxOTk2MDAsImV4cCI6MTc2MDI4NjAwMH0.H2XrIdcG4leMO2hNqe2qYcQRitEcCyBx1Zl5ZEpIHjE 200 in 2229ms
[dev:frontend] Error: Route "/api/arte-aprovacao/comentarios/versao/[versaoId]" used `params.versaoId`. `params` should be awaited before using its properties. Learn more: https://nextjs.org/docs/messages/sync-dynamic-apis
[dev:frontend]     at GET (src\app\api\arte-aprovacao\comentarios\versao\[versaoId]\route.ts:8:12)
[dev:frontend]    6 | ) {
[dev:frontend]    7 |   try {
[dev:frontend] >  8 |     const { versaoId } = params;
[dev:frontend]      |            ^
[dev:frontend]    9 |
[dev:frontend]   10 |     const response = await fetch(`${process.env.BACKEND_URL}/arte-aprovacao/comentarios/versao/${versaoId}`, {
[dev:frontend]   11 |       method: 'GET',
[dev:frontend]  GET /api/arte-aprovacao/comentarios/versao/cmgmjqd6d0001w450acodyosh 200 in 259ms
[dev:frontend] 🎨 [API Route] Criando versão: {
[dev:frontend]   os_id: 'cmgmj3n740004w4hsud1bzls4',
[dev:frontend]   versao: 'v2',
[dev:frontend]   status: 'RASCUNHO',
[dev:frontend]   descricao: 'Nova versão v2 - Banana Bolt novo 6',
[dev:frontend]   servico_id: 'servico-principal'
[dev:frontend] }
[dev:backend] 🎨 [Controller] Criando versão: {
[dev:backend]   osId: 'cmgmj3n740004w4hsud1bzls4',
[dev:backend]   versao: 'v2',
[dev:backend]   usuarioId: 'tfdlzxwcx',
[dev:backend]   lojaId: 'tisruw9j7'
[dev:backend] }
[dev:backend] 🎨 Criando nova versão de arte: {
[dev:backend]   osId: 'cmgmj3n740004w4hsud1bzls4',
[dev:backend]   versao: 'v2',
[dev:backend]   autorId: 'tfdlzxwcx',
[dev:backend]   lojaId: 'tisruw9j7'
[dev:backend] }
[dev:backend] ✅ Versão criada com sucesso: cmgmjy2p30001w4t8es75p72b
[dev:frontend] ✅ [API Route] Versão criada: cmgmjy2p30001w4t8es75p72b
[dev:frontend]  POST /api/arte-aprovacao/versoes 200 in 248ms
[dev:frontend] 📤 [API Route] Upload de arquivo para versão: cmgmjy2p30001w4t8es75p72b
[dev:backend] 📤 [Controller] Upload de arquivo: {
[dev:backend]   versaoId: 'cmgmjy2p30001w4t8es75p72b',
[dev:backend]   nomeArquivo: 'thumb-video.png',
[dev:backend]   tamanho: 3903518,
[dev:backend]   path: 'C:\\Projects\\comunikapp\\backend\\uploads\\arte\\cmgmjy2p30001w4t8es75p72b\\1760203886112-508798146-thumb_video.png',
[dev:backend]   lojaId: 'tisruw9j7'
[dev:backend] }
[dev:backend] [Nest] 11420  - 11/10/2025, 14:31:26   ERROR [ArteThumbnailService] ❌ Erro ao gerar thumbnail: (0 , sharp_1.default) is not a function
[dev:backend] 📤 Adicionando arquivo à versão: {
[dev:backend]   versaoId: 'cmgmjy2p30001w4t8es75p72b',
[dev:backend]   arquivoData: {
[dev:backend]     nome_arquivo: '1760203886112-508798146-thumb_video.png',
[dev:backend]     nome_original: 'thumb-video.png',
[dev:backend]     tipo_arquivo: 'png',
[dev:backend]     tamanho: 3903518n,
[dev:backend]     url_arquivo: '/api/arte-aprovacao/versoes/cmgmjy2p30001w4t8es75p72b/arquivos/download/1760203886112-508798146-thumb_video.png',
[dev:backend]     url_thumbnail: undefined,
[dev:backend]     storage_provider: 'local',
[dev:backend]     storage_path: 'C:\\Projects\\comunikapp\\backend\\uploads\\arte\\cmgmjy2p30001w4t8es75p72b\\1760203886112-508798146-thumb_video.png'
[dev:backend]   },
[dev:backend]   lojaId: 'tisruw9j7'
[dev:backend] }
[dev:backend] TypeError: (0 , sharp_1.default) is not a function
[dev:backend]     at ArteThumbnailService.generateThumbnail (C:\Projects\comunikapp\backend\src\modules\arte-aprovacao\services\arte-thumbnail.service.ts:48:18)       
[dev:backend]     at ArteArquivoController.uploadArquivo (C:\Projects\comunikapp\backend\src\modules\arte-aprovacao\controllers\arte-arquivo.controller.ts:91:51)      
[dev:backend]     at C:\Projects\comunikapp\backend\node_modules\@nestjs\core\router\router-execution-context.js:38:29
[dev:backend]     at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
[dev:backend] ✅ Arquivo adicionado com sucesso: cmgmjy2xk0003w4t8qh60tl19
[dev:frontend] ✅ [API Route] Arquivo enviado: cmgmjy2xk0003w4t8qh60tl19
[dev:frontend]  POST /api/arte-aprovacao/versoes/cmgmjy2p30001w4t8es75p72b/arquivos/upload 200 in 296ms
[dev:frontend] 🔍 [API Route] Listando versões da OS: cmgmj3n740004w4hsud1bzls4
[dev:backend] 📋 [Controller] Listando versões da OS: { osId: 'cmgmj3n740004w4hsud1bzls4', lojaId: 'tisruw9j7' }
[dev:backend] 🔍 Buscando versões da OS: { osId: 'cmgmj3n740004w4hsud1bzls4', lojaId: 'tisruw9j7' }
[dev:backend] 📋 Encontradas 2 versões
[dev:frontend] ✅ [API Route] 2 versões encontradas
[dev:frontend]  GET /api/arte-aprovacao/versoes/os/cmgmj3n740004w4hsud1bzls4 200 in 156ms
[dev:backend] ❌ Erro ao enviar email: Error: Missing credentials for "PLAIN"
[dev:backend]     at SMTPConnection._formatError (C:\Projects\comunikapp\backend\node_modules\nodemailer\lib\smtp-connection\index.js:809:19)
[dev:backend]     at SMTPConnection.login (C:\Projects\comunikapp\backend\node_modules\nodemailer\lib\smtp-connection\index.js:454:38)
[dev:backend]     at C:\Projects\comunikapp\backend\node_modules\nodemailer\lib\smtp-transport\index.js:272:32
[dev:backend]     at SMTPConnection.<anonymous> (C:\Projects\comunikapp\backend\node_modules\nodemailer\lib\smtp-connection\index.js:215:17)
[dev:backend]     at Object.onceWrapper (node:events:632:28)
[dev:backend]     at SMTPConnection.emit (node:events:518:28)
[dev:backend]     at SMTPConnection._actionEHLO (C:\Projects\comunikapp\backend\node_modules\nodemailer\lib\smtp-connection\index.js:1371:14)
[dev:backend]     at SMTPConnection._processResponse (C:\Projects\comunikapp\backend\node_modules\nodemailer\lib\smtp-connection\index.js:993:20)
[dev:backend]     at SMTPConnection._onData (C:\Projects\comunikapp\backend\node_modules\nodemailer\lib\smtp-connection\index.js:774:14)
[dev:backend]     at SMTPConnection._onSocketData (C:\Projects\comunikapp\backend\node_modules\nodemailer\lib\smtp-connection\index.js:195:44) {
[dev:backend]   code: 'EAUTH',
[dev:backend]   command: 'API'
[dev:backend] }
[dev:backend] ❌ Erro ao enviar notificação de aprovação solicitada: Error: Missing credentials for "PLAIN"
[dev:backend]     at SMTPConnection._formatError (C:\Projects\comunikapp\backend\node_modules\nodemailer\lib\smtp-connection\index.js:809:19)
[dev:backend]     at SMTPConnection.login (C:\Projects\comunikapp\backend\node_modules\nodemailer\lib\smtp-connection\index.js:454:38)
[dev:backend]     at C:\Projects\comunikapp\backend\node_modules\nodemailer\lib\smtp-transport\index.js:272:32
[dev:backend]     at SMTPConnection.<anonymous> (C:\Projects\comunikapp\backend\node_modules\nodemailer\lib\smtp-connection\index.js:215:17)
[dev:backend]     at Object.onceWrapper (node:events:632:28)
[dev:backend]     at SMTPConnection.emit (node:events:518:28)
[dev:backend]     at SMTPConnection._actionEHLO (C:\Projects\comunikapp\backend\node_modules\nodemailer\lib\smtp-connection\index.js:1371:14)
[dev:backend]     at SMTPConnection._processResponse (C:\Projects\comunikapp\backend\node_modules\nodemailer\lib\smtp-connection\index.js:993:20)
[dev:backend]     at SMTPConnection._onData (C:\Projects\comunikapp\backend\node_modules\nodemailer\lib\smtp-connection\index.js:774:14)
[dev:backend]     at SMTPConnection._onSocketData (C:\Projects\comunikapp\backend\node_modules\nodemailer\lib\smtp-connection\index.js:195:44) {
[dev:backend]   code: 'EAUTH',
[dev:backend]   command: 'API'
[dev:backend] }
[dev:frontend]  POST /api/arte-aprovacao/links 200 in 1414ms
[dev:frontend]  ○ Compiling /arte/aprovacao/[token] ...
[dev:frontend]  ✓ Compiled /arte/aprovacao/[token] in 1380ms
[dev:frontend]  GET /arte/aprovacao/07a8fb0b-5299-4dd2-afd2-7355d2d34981-mgmjyfb2-a89b2a9795f8978d 200 in 2722ms
[dev:frontend]  ○ Compiling /api/arte-aprovacao/links/public/[token] ...
[dev:frontend]  ✓ Compiled /api/arte-aprovacao/links/public/[token] in 581ms
[dev:frontend]  GET /api/arte-aprovacao/links/public/07a8fb0b-5299-4dd2-afd2-7355d2d34981-mgmjyfb2-a89b2a9795f8978d 200 in 1902ms
[dev:frontend] 📥 [API Route] Download de arquivo: {
[dev:frontend]   versaoId: 'cmgmjy2p30001w4t8es75p72b',
[dev:frontend]   filename: '1760203886112-508798146-thumb_video.png'
[dev:frontend] }
[dev:backend] [Nest] 11420  - 11/10/2025, 14:31:56   ERROR [JwtGlobalMiddleware] ❌ Erro na validação JWT: jwt malformed
[dev:backend] [Nest] 11420  - 11/10/2025, 14:31:56   ERROR [JwtGlobalMiddleware] 🔍 Stack trace: JsonWebTokenError: jwt malformed
[dev:backend]     at module.exports [as verify] (C:\Projects\comunikapp\backend\node_modules\jsonwebtoken\verify.js:70:17)
[dev:backend]     at JwtService.verify (C:\Projects\comunikapp\backend\node_modules\@nestjs\jwt\dist\jwt.service.js:67:20)
[dev:backend]     at JwtGlobalMiddleware.use (C:\Projects\comunikapp\backend\src\common\middleware\jwt-global.middleware.ts:70:39)
[dev:backend]     at C:\Projects\comunikapp\backend\node_modules\@nestjs\core\router\router-proxy.js:9:23
[dev:backend]     at Layer.handleRequest (C:\Projects\comunikapp\backend\node_modules\router\lib\layer.js:152:17)
[dev:backend]     at next (C:\Projects\comunikapp\backend\node_modules\router\lib\route.js:157:13)
[dev:backend]     at Route.dispatch (C:\Projects\comunikapp\backend\node_modules\router\lib\route.js:117:3)
[dev:backend]     at handle (C:\Projects\comunikapp\backend\node_modules\router\index.js:435:11)
[dev:backend]     at Layer.handleRequest (C:\Projects\comunikapp\backend\node_modules\router\lib\layer.js:152:17)
[dev:backend]     at C:\Projects\comunikapp\backend\node_modules\router\index.js:295:15
[dev:frontend] ❌ [API Route] Erro do backend: {
[dev:frontend]   message: 'Token inválido ou expirado',
[dev:frontend]   error: 'Unauthorized',
[dev:frontend]   statusCode: 401
[dev:frontend] }
[dev:frontend]  GET /api/arte-aprovacao/versoes/cmgmjy2p30001w4t8es75p72b/arquivos/download/1760203886112-508798146-thumb_video.png?token=07a8fb0b-5299-4dd2-afd2-7355d2d34981-mgmjyfb2-a89b2a9795f8978d 401 in 257ms
[dev:frontend]  ○ Compiling /api/arte-aprovacao/comentarios/public/[versaoId]/[token] ...
[dev:frontend]  ✓ Compiled /api/arte-aprovacao/comentarios/public/[versaoId]/[token] in 703ms
[dev:frontend] Error: Route "/api/arte-aprovacao/comentarios/public/[versaoId]/[token]" used `params.versaoId`. `params` should be awaited before using its properties. Learn more: https://nextjs.org/docs/messages/sync-dynamic-apis
[dev:frontend]     at GET (src\app\api\arte-aprovacao\comentarios\public\[versaoId]\[token]\route.ts:8:12)
[dev:frontend]    6 | ) {
[dev:frontend]    7 |   try {
[dev:frontend] >  8 |     const { versaoId, token } = params;
[dev:frontend]      |            ^
[dev:frontend]    9 |
[dev:frontend]   10 |     const response = await fetch(`${process.env.BACKEND_URL}/arte-aprovacao/comentarios/public/${versaoId}/${token}`, {
[dev:frontend]   11 |       method: 'GET',
[dev:frontend] Error: Route "/api/arte-aprovacao/comentarios/public/[versaoId]/[token]" used `params.token`. `params` should be awaited before using its properties. Learn more: https://nextjs.org/docs/messages/sync-dynamic-apis
[dev:frontend]     at GET (src\app\api\arte-aprovacao\comentarios\public\[versaoId]\[token]\route.ts:8:22)
[dev:frontend]    6 | ) {
[dev:frontend]    7 |   try {
[dev:frontend] >  8 |     const { versaoId, token } = params;
[dev:frontend]      |                      ^
[dev:frontend]    9 |
[dev:frontend]   10 |     const response = await fetch(`${process.env.BACKEND_URL}/arte-aprovacao/comentarios/public/${versaoId}/${token}`, {
[dev:frontend]   11 |       method: 'GET',
[dev:frontend]  GET /api/arte-aprovacao/comentarios/public/cmgmjy2p30001w4t8es75p72b/07a8fb0b-5299-4dd2-afd2-7355d2d34981-mgmjyfb2-a89b2a9795f8978d 200 in 2197ms      
[dev:frontend] Error: Route "/api/arte-aprovacao/comentarios/public/[versaoId]/[token]" used `params.versaoId`. `params` should be awaited before using its properties. Learn more: https://nextjs.org/docs/messages/sync-dynamic-apis
[dev:frontend]     at GET (src\app\api\arte-aprovacao\comentarios\public\[versaoId]\[token]\route.ts:8:12)
[dev:frontend]    6 | ) {
[dev:frontend]    7 |   try {
[dev:frontend] >  8 |     const { versaoId, token } = params;
[dev:frontend]      |            ^
[dev:frontend]    9 |
[dev:frontend]   10 |     const response = await fetch(`${process.env.BACKEND_URL}/arte-aprovacao/comentarios/public/${versaoId}/${token}`, {
[dev:frontend]   11 |       method: 'GET',
[dev:frontend] Error: Route "/api/arte-aprovacao/comentarios/public/[versaoId]/[token]" used `params.token`. `params` should be awaited before using its properties. Learn more: https://nextjs.org/docs/messages/sync-dynamic-apis
[dev:frontend]     at GET (src\app\api\arte-aprovacao\comentarios\public\[versaoId]\[token]\route.ts:8:22)
[dev:frontend]    6 | ) {
[dev:frontend]    7 |   try {
[dev:frontend] >  8 |     const { versaoId, token } = params;
[dev:frontend]      |                      ^
[dev:frontend]    9 |
[dev:frontend]   10 |     const response = await fetch(`${process.env.BACKEND_URL}/arte-aprovacao/comentarios/public/${versaoId}/${token}`, {
[dev:frontend]   11 |       method: 'GET',
[dev:frontend]  GET /api/arte-aprovacao/comentarios/public/cmgmjy2p30001w4t8es75p72b/07a8fb0b-5299-4dd2-afd2-7355d2d34981-mgmjyfb2-a89b2a9795f8978d 200 in 356ms
