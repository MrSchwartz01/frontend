const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  publicPath: process.env.NODE_ENV === 'production' ? '/' : '/',
  outputDir: 'dist',
  assetsDir: 'static',
  transpileDependencies: [],
  devServer: {
    host: '0.0.0.0', // Permitir acceso desde cualquier IP en la red
    port: 8080,
    allowedHosts: 'all', // Permitir todos los hosts
  }
})
