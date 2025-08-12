PS C:\Projects\comunikapp> npm run dev

> comunikapp@1.0.0 dev
> concurrently "npm:dev:frontend" "npm:dev:backend"

[dev:frontend] 
[dev:frontend] > comunikapp@1.0.0 dev:frontend    
[dev:frontend] > npm run dev --prefix frontend    
[dev:frontend] 
[dev:backend] 
[dev:backend] > comunikapp@1.0.0 dev:backend      
[18:52:13] Starting compilation in watch mode...
[dev:backend]
[dev:frontend]  ✓ Ready in 2.6s
[dev:backend] apps/inventory/src/services/location.service.ts:40:66 - error TS2339: Property 'inventoryLocation' does not exist on 
type 'DynamicClientExtensionThis<TypeMap<InternalArgs & { result: {}; model: {}; query: {}; client: {}; }, {}>, TypeMapCb<PrismaClientOptions>, { result: {}; model: {}; query: {}; client: {}; }>'.
[dev:backend]
[dev:backend] 40     const existingLocation = await this.prisma.forTenant(lojaId).inventoryLocation.findUnique({
[dev:backend]                                                                     ~~~~~~~~~~~~~~~~~
[dev:backend]
[dev:backend] apps/inventory/src/services/location.service.ts:48:42 - error TS2339: Property 'inventoryLocation' does not exist on 
type 'DynamicClientExtensionThis<TypeMap<InternalArgs & { result: {}; model: {}; query: {}; client: {}; }, {}>, TypeMapCb<PrismaClientOptions>, { result: {}; model: {}; query: {}; client: {}; }>'.
[dev:backend]
[dev:backend] 48     return this.prisma.forTenant(lojaId).inventoryLocation.create({
[dev:backend]                                             ~~~~~~~~~~~~~~~~~
[dev:backend]
[dev:backend] apps/inventory/src/services/location.service.ts:85:37 - error TS2339: Property 'inventoryLocation' does not exist on 
type 'DynamicClientExtensionThis<TypeMap<InternalArgs & { result: {}; model: {}; query: {}; client: {}; }, {}>, TypeMapCb<PrismaClientOptions>, { result: {}; model: {}; query: {}; client: {}; }>'.
[dev:backend]
[dev:backend] 85       this.prisma.forTenant(lojaId).inventoryLocation.findMany({
[dev:backend]                                        ~~~~~~~~~~~~~~~~~
[dev:backend]
[dev:backend] apps/inventory/src/services/location.service.ts:91:37 - error TS2339: Property 'inventoryLocation' does not exist on 
type 'DynamicClientExtensionThis<TypeMap<InternalArgs & { result: {}; model: {}; query: {}; client: {}; }, {}>, TypeMapCb<PrismaClientOptions>, { result: {}; model: {}; query: {}; client: {}; }>'.
[dev:backend]
[dev:backend] 91       this.prisma.forTenant(lojaId).inventoryLocation.count({ where }),
[dev:backend]                                        ~~~~~~~~~~~~~~~~~
[dev:backend]
[dev:backend] apps/inventory/src/services/location.service.ts:108:58 - error TS2339: Property 'inventoryLocation' does not exist on type 'DynamicClientExtensionThis<TypeMap<InternalArgs & { result: {}; model: {}; query: {}; client: {}; }, {}>, TypeMapCb<PrismaClientOptions>, { result: {}; model: {}; query: {}; client: {}; }>'.
[dev:backend]
[dev:backend] 108     const location = await this.prisma.forTenant(lojaId).inventoryLocation.findUnique({
[dev:backend]                                                              ~~~~~~~~~~~~~~~~~
[dev:backend]
[dev:backend] apps/inventory/src/services/location.service.ts:120:58 - error TS2339: Property 'inventoryLocation' does not exist on type 'DynamicClientExtensionThis<TypeMap<InternalArgs & { result: {}; model: {}; query: {}; client: {}; }, {}>, TypeMapCb<PrismaClientOptions>, { result: {}; model: {}; query: {}; client: {}; }>'.
[dev:backend]
[dev:backend] 120     const location = await this.prisma.forTenant(lojaId).inventoryLocation.findUnique({
[dev:backend]                                                              ~~~~~~~~~~~~~~~~~
[dev:backend]
[dev:backend] apps/inventory/src/services/location.service.ts:133:66 - error TS2339: Property 'inventoryLocation' does not exist on type 'DynamicClientExtensionThis<TypeMap<InternalArgs & { result: {}; model: {}; query: {}; client: {}; }, {}>, TypeMapCb<PrismaClientOptions>, { result: {}; model: {}; query: {}; client: {}; }>'.
[dev:backend]
[dev:backend] 133     const existingLocation = await this.prisma.forTenant(lojaId).inventoryLocation.findUnique({
[dev:backend]                                                                      ~~~~~~~~~~~~~~~~~
[dev:backend]
[dev:backend] apps/inventory/src/services/location.service.ts:143:65 - error TS2339: Property 'inventoryLocation' does not exist on type 'DynamicClientExtensionThis<TypeMap<InternalArgs & { result: {}; model: {}; query: {}; client: {}; }, {}>, TypeMapCb<PrismaClientOptions>, { result: {}; model: {}; query: {}; client: {}; }>'.
[dev:backend]
[dev:backend] 143       const duplicateCode = await this.prisma.forTenant(lojaId).inventoryLocation.findFirst({
[dev:backend]                                                                     ~~~~~~~~~~~~~~~~~
[dev:backend]
[dev:backend] apps/inventory/src/services/location.service.ts:152:42 - error TS2339: Property 'inventoryLocation' does not exist on type 'DynamicClientExtensionThis<TypeMap<InternalArgs & { result: {}; model: {}; query: {}; client: {}; }, {}>, TypeMapCb<PrismaClientOptions>, { result: {}; model: {}; query: {}; client: {}; }>'.
[dev:backend]
[dev:backend] 152     return this.prisma.forTenant(lojaId).inventoryLocation.update({
[dev:backend]                                              ~~~~~~~~~~~~~~~~~
[dev:backend]
[dev:backend] apps/inventory/src/services/location.service.ts:160:58 - error TS2339: Property 'inventoryLocation' does not exist on type 'DynamicClientExtensionThis<TypeMap<InternalArgs & { result: {}; model: {}; query: {}; client: {}; }, {}>, TypeMapCb<PrismaClientOptions>, { result: {}; model: {}; query: {}; client: {}; }>'.
[dev:backend]
[dev:backend] 160     const location = await this.prisma.forTenant(lojaId).inventoryLocation.findUnique({
[dev:backend]                                                              ~~~~~~~~~~~~~~~~~
[dev:backend]
[dev:backend] apps/inventory/src/services/location.service.ts:169:60 - error TS2339: Property 'inventoryStock' does not exist on type 'DynamicClientExtensionThis<TypeMap<InternalArgs & { result: {}; model: {}; query: {}; client: {}; }, {}>, TypeMapCb<PrismaClientOptions>, { result: {}; model: {}; query: {}; client: {}; }>'.
[dev:backend]
[dev:backend] 169     const stockCount = await this.prisma.forTenant(lojaId).inventoryStock.count({
[dev:backend]                                                                ~~~~~~~~~~~~~~
[dev:backend]
[dev:backend] apps/inventory/src/services/location.service.ts:177:42 - error TS2339: Property 'inventoryLocation' does not exist on type 'DynamicClientExtensionThis<TypeMap<InternalArgs & { result: {}; model: {}; query: {}; client: {}; }, {}>, TypeMapCb<PrismaClientOptions>, { result: {}; model: {}; query: {}; client: {}; }>'.
[dev:backend]
[dev:backend] 177     return this.prisma.forTenant(lojaId).inventoryLocation.delete({
[dev:backend]                                              ~~~~~~~~~~~~~~~~~
[dev:backend]
[dev:backend] apps/inventory/src/services/location.service.ts:191:37 - error TS2339: Property 'inventoryLocation' does not exist on type 'DynamicClientExtensionThis<TypeMap<InternalArgs & { result: {}; model: {}; query: {}; client: {}; }, {}>, TypeMapCb<PrismaClientOptions>, { result: {}; model: {}; query: {}; client: {}; }>'.
[dev:backend]
[dev:backend] 191       this.prisma.forTenant(lojaId).inventoryLocation.count(),
[dev:backend]                                         ~~~~~~~~~~~~~~~~~
[dev:backend]
[dev:backend] apps/inventory/src/services/location.service.ts:192:37 - error TS2339: Property 'inventoryLocation' does not exist on type 'DynamicClientExtensionThis<TypeMap<InternalArgs & { result: {}; model: {}; query: {}; client: {}; }, {}>, TypeMapCb<PrismaClientOptions>, { result: {}; model: {}; query: {}; client: {}; }>'.
[dev:backend]
[dev:backend] 192       this.prisma.forTenant(lojaId).inventoryLocation.count({ where: { ativo: true } }),
[dev:backend]                                         ~~~~~~~~~~~~~~~~~
[dev:backend]
[dev:backend] apps/inventory/src/services/location.service.ts:193:37 - error TS2339: Property 'inventoryLocation' does not exist on type 'DynamicClientExtensionThis<TypeMap<InternalArgs & { result: {}; model: {}; query: {}; client: {}; }, {}>, TypeMapCb<PrismaClientOptions>, { result: {}; model: {}; query: {}; client: {}; }>'.
[dev:backend]
[dev:backend] 193       this.prisma.forTenant(lojaId).inventoryLocation.count({
[dev:backend]                                         ~~~~~~~~~~~~~~~~~
[dev:backend]
[dev:backend] apps/inventory/src/services/location.service.ts:198:37 - error TS2339: Property 'inventoryLocation' does not exist on type 'DynamicClientExtensionThis<TypeMap<InternalArgs & { result: {}; model: {}; query: {}; client: {}; }, {}>, TypeMapCb<PrismaClientOptions>, { result: {}; model: {}; query: {}; client: {}; }>'.
[dev:backend]
[dev:backend] 198       this.prisma.forTenant(lojaId).inventoryLocation.count({
[dev:backend]                                         ~~~~~~~~~~~~~~~~~
[dev:backend]
[dev:backend] apps/inventory/src/services/location.service.ts:204:37 - error TS2339: Property 'inventoryLocation' does not exist on type 'DynamicClientExtensionThis<TypeMap<InternalArgs & { result: {}; model: {}; query: {}; client: {}; }, {}>, TypeMapCb<PrismaClientOptions>, { result: {}; model: {}; query: {}; client: {}; }>'.
[dev:backend]
[dev:backend] 204       this.prisma.forTenant(lojaId).inventoryLocation.aggregate({
[dev:backend]                                         ~~~~~~~~~~~~~~~~~
[dev:backend]
[dev:backend] apps/inventory/src/services/location.service.ts:207:37 - error TS2339: Property 'inventoryStock' does not exist on type 'DynamicClientExtensionThis<TypeMap<InternalArgs & { result: {}; model: {}; query: {}; client: {}; }, {}>, TypeMapCb<PrismaClientOptions>, { result: {}; model: {}; query: {}; client: {}; }>'.
[dev:backend]
[dev:backend] 207       this.prisma.forTenant(lojaId).inventoryStock.aggregate({
[dev:backend]                                         ~~~~~~~~~~~~~~
[dev:backend]
[dev:backend] apps/inventory/src/services/location.service.ts:229:42 - error TS2339: Property 'inventoryLocation' does not exist on type 'DynamicClientExtensionThis<TypeMap<InternalArgs & { result: {}; model: {}; query: {}; client: {}; }, {}>, TypeMapCb<PrismaClientOptions>, { result: {}; model: {}; query: {}; client: {}; }>'.
[dev:backend]
[dev:backend] 229     return this.prisma.forTenant(lojaId).inventoryLocation.groupBy({
[dev:backend]                                              ~~~~~~~~~~~~~~~~~
[dev:backend]
[dev:backend] apps/inventory/src/services/location.service.ts:247:42 - error TS2339: Property 'inventoryLocation' does not exist on type 'DynamicClientExtensionThis<TypeMap<InternalArgs & { result: {}; model: {}; query: {}; client: {}; }, {}>, TypeMapCb<PrismaClientOptions>, { result: {}; model: {}; query: {}; client: {}; }>'.
[dev:backend]
[dev:backend] 247     return this.prisma.forTenant(lojaId).inventoryLocation.findMany({
[dev:backend]                                              ~~~~~~~~~~~~~~~~~
[dev:backend]
[dev:backend] [18:52:26] Found 20 errors. Watching for file changes.
[dev:backend]
[dev:backend] node:internal/modules/cjs/loader:1228
[dev:backend]   throw err;
[dev:backend]   ^
[dev:backend]
[dev:backend] Error: Cannot find module 'C:\Projects\comunikapp\backend\dist\main'
[dev:backend]     at Function._resolveFilename (node:internal/modules/cjs/loader:1225:15)
[dev:backend]     at Function._load (node:internal/modules/cjs/loader:1055:27)
[dev:backend]     at TracingChannel.traceSync (node:diagnostics_channel:322:14)
[dev:backend]     at wrapModuleLoad (node:internal/modules/cjs/loader:220:24)
[dev:backend]     at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:170:5)
[dev:backend]     at node:internal/main/run_main_module:36:49 {
[dev:backend]   code: 'MODULE_NOT_FOUND',
[dev:backend]   requireStack: []
[dev:backend] }
[dev:backend]
[dev:backend] Node.js v22.14.0
