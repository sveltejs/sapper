<script>
  import { goto } from '@sapper/app';
  function search(query) {
    goto(window.location.pathname + `?q=${query}`);
  }
</script>

<h1>A search form</h1>

<div style="height: 9999px" />

<div id="search">
  <button id="submit-search" on:click={() => search('test')}>Search</button>
</div>

<div style="height: 5000px" />

<div id="end">
  <button id="navigate" on:click={() => goto('/tall-page')}>Navigate away</button>
</div>