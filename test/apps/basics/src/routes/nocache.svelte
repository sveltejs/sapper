<h1>Look, no cache!</h1>

<p>I have a `no-cache` header.</p>

<script context="module">
  export function preload() {
    this.setHeader('Cache-Control', 'no-cache');
  }
</script>