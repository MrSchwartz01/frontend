const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  publicPath: process.env.NODE_ENV === 'production' ? '/' : '/',
  outputDir: 'dist',
  assetsDir: 'static',
  transpileDependencies: [],
  devServer: {
    proxy:{
      '/api': {
        target: 'https://chpc-webpage-back.vercel.app', // Cambia esto al backend real
        changeOrigin: true,
        pathRewrite: { '^/api': '' },
      },
    }
  }
})
