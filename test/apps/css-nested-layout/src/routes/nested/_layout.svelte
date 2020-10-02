<script>
    import Test from '../_components/Test.svelte';
</script>

<h2>This is content defined in a layout in a nested route. It should have a green background.</h2>

<Test/>

<slot></slot>

<style>
    h2 {
        background-color: rgb(0, 128, 0);
        color: #fff;
        margin-bottom: 2rem;
    }
</style>