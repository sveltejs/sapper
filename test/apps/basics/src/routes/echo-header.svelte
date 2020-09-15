<h1>Headers</h1>

<p>The foobar header was: <span id='header'>{headerValue}</span></p>

<script>
  export let headerValue;
</script>

<script context="module">
  export function preload() {
    return { headerValue: this.getHeader('Foobar') };
  }
</script>