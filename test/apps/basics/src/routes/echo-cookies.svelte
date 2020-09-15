<h1>Cookies</h1>

<p>The cookie header was: <span id='cookie'>{cookie}</span></p>

<script>
  export let cookie;
</script>

<script context="module">
  export function preload() {
    return { cookie: this.getHeader('Cookie') };
  }
</script>