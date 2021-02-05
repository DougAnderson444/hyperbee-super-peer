import App from './App.svelte'

const app = new App({
  target: document.body,
  props: {
    name: 'world',
    id: 'is yours'
  }
})

export default app
