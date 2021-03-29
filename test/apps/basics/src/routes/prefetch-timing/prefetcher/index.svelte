<script context="module">
    export function preload() {
        if (typeof window !== 'undefined') {
            return new Promise((resolve) => {
                window.onPrefetched = resolve;
            });
        }
    }
</script>

<h1>Prefetcher</h1>

<a href="/prefetch-timing/prefetched" rel="prefetch">prefetched</a>
