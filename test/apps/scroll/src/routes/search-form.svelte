<script>
  import { goto } from "@sapper/app";

  function handleSearch() {
    goto("/a-third-tall-page", { noscroll: true });
  }
</script>

<h1>A search form</h1>

<div style="height: 9999px" />

<div id="search">
  <button on:click={handleSearch}>Search</button>
</div>

