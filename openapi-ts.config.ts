import { $, defineConfig, definePluginConfig } from '@hey-api/openapi-ts'

export const definePathsPlugin = definePluginConfig({
  config: {
    // @ts-expect-error ignore
    output: 'paths',
  },
  dependencies: ['@hey-api/typescript'],
  handler: ({ plugin }) => {
    const pathMapTypeName = 'PathMap'
    const urlsTypeName = 'Urls'
    const pathMethodsTypeName = 'PathMethods'

    const pathsSymbol = plugin.symbol(pathMapTypeName, {
      // @ts-expect-error ignore
      getFilePath: () => `${plugin.config.output}.gen`,
      kind: 'type',
      meta: {
        category: 'type',
        resource: 'custom.paths',
      },
    })
    const urlsSymbol = plugin.symbol(urlsTypeName, {
      // @ts-expect-error ignore
      getFilePath: () => `${plugin.config.output}.gen`,
      kind: 'type',
      meta: {
        category: 'type',
        resource: 'custom.paths',
      },
    })
    const pathMethodsSymbol = plugin.symbol(pathMethodsTypeName, {
      // @ts-expect-error ignore
      getFilePath: () => `${plugin.config.output}.gen`,
      kind: 'type',
      meta: {
        category: 'type',
        resource: 'custom.paths',
      },
    })
    const pathParamsSymbol = plugin.symbol('PathParams', {
      // @ts-expect-error ignore
      getFilePath: () => `${plugin.config.output}.gen`,
      kind: 'type',
      meta: {
        category: 'type',
        resource: 'custom.paths',
      },
    })
    const pathResponseSymbol = plugin.symbol('PathResponse', {
      // @ts-expect-error ignore
      getFilePath: () => `${plugin.config.output}.gen`,
      kind: 'type',
      meta: {
        category: 'type',
        resource: 'custom.paths',
      },
    })

    const pathsObject = $.type.object()
    const pathMap = new Map<string, ReturnType<typeof $.type.object>>()

    plugin.forEach('operation', ({ method, operation, path }) => {
      let pathNode = pathMap.get(path)
      if (!pathNode) {
        pathNode = $.type.object()
        pathMap.set(path, pathNode)
        pathsObject.prop(path, p => p.type(pathNode!))
      }

      const paramsSymbol = plugin.querySymbol({
        resource: 'operation',
        resourceId: operation.id,
        role: 'data',
        tool: 'typescript',
      })

      const responsesSymbol = plugin.querySymbol({
        resource: 'operation',
        resourceId: operation.id,
        role: 'response',
        tool: 'typescript',
      })

      pathNode.prop(method, m =>
        m.type(
          $.type
            .object()
            .prop('params', p =>
              p.type(
                paramsSymbol
                  ? $.type('Omit').generic($.type(paramsSymbol)).generic($.type.literal('url'))
                  : 'never',
              ))
            .prop('responses', p =>
              p.type(responsesSymbol ? $.type(responsesSymbol) : 'never')),
        ))
    })

    plugin.node($.type.alias(pathsSymbol).export().type(pathsObject))
    plugin.node(
      $.type.alias(urlsSymbol)
        .export()
        .type($.type(pathsSymbol).keyof()),
    )
    plugin.node(
      $.type.alias(pathMethodsSymbol)
        .export()
        .generic('Url', g => g.extends($.type(urlsSymbol)))
        .type($.type(pathsSymbol).idx($.type('Url')).keyof()),
    )
    plugin.node(
      $.type.alias(pathParamsSymbol)
        .export()
        .generic('Url', g => g.extends($.type(urlsSymbol)))
        .generic('Method', g => g
          .extends($.type(pathMethodsSymbol).generic($.type('Url')))
          .default($.type(pathMethodsTypeName).generic($.type('Url'))))
        .type(
          $.type(`${pathMapTypeName}[Url][Method] extends { params: infer Params } ? Params : never`),
        ),
    )
    plugin.node(
      $.type.alias(pathResponseSymbol)
        .export()
        .generic('Url', g => g.extends($.type(urlsSymbol)))
        .generic('Method', g => g
          .extends($.type(pathMethodsSymbol).generic($.type('Url')))
          .default($.type(pathMethodsTypeName).generic($.type('Url'))))
        .type(
          $.type(`${pathMapTypeName}[Url][Method] extends { responses: infer Responses } ? Responses : never`),
        ),
    )
  },
  name: 'custom-paths-plugin',
})

export default defineConfig({
  input: 'http://127.0.0.1:3000/api/openapi/json/json',
  output: {
    path: './src/api/auto',
    postProcess: ['prettier', 'eslint'],
    source: true,
  },
  plugins: [
    {
      includeInEntry: true,
      name: '@hey-api/schemas',
    },
    {
      enums: 'javascript',
      includeInEntry: true,
      name: '@hey-api/typescript',
    },
    {
      compatibilityVersion: 4,
      includeInEntry: true,
      metadata: true,
      name: 'zod',
    },
    definePathsPlugin({ output: 'paths' }),
  ],
})
