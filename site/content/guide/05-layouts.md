---
title: Layouts
---

So far, we've treated pages as entirely standalone components — upon navigation, the existing component will be destroyed, and a new one will take its place.

But in many apps, there are elements that should be visible on *every* page, such as top-level navigation or a footer. Instead of repeating them in every page, we can use *layout* components.

To create a layout component that applies to every page, make a file called `src/routes/_layout.html`. The default layout component (the one that Sapper uses if you don't bring your own) looks like this...

```html
<svelte:component this={child.component} {...child.props}/>
```

...but we can add whatever markup, styles and behaviour we want. For example, let's add a nav bar:

```html
<!-- src/routes/_layout.html -->
<nav>
	<a href=".">Home</a>
	<a href="about">About</a>
	<a href="settings">Settings</a>
</nav>

<svelte:component this={child.component} {...child.props}/>
```

Sapper computes the `child` property based on which page the user has navigated to. If we create pages for `/`, `/about` and `/settings`...

```html
<!-- src/routes/index.html -->
<h1>Home</h1>
```

```html
<!-- src/routes/about.html -->
<h1>About</h1>
```

```html
<!-- src/routes/settings.html -->
<h1>Settings</h1>
```

...the nav will always be visible, and clicking between the three pages will only result in the `<h1>` being replaced.


### Nested routes

Suppose we don't just have a single `/settings` page, but instead have nested pages like `/settings/profile` and `/settings/notifications` with a shared submenu (for an real-life example, see [github.com/settings](https://github.com/settings)).

We can create a layout that only applies to pages below `/settings` (while inheriting the root layout with the top-level nav):

```html
<!-- src/routes/settings/_layout.html -->
<h1>Settings</h1>

<div class="submenu">
	<a href="settings/profile">Profile</a>
	<a href="settings/notifications">Notifications</a>
</div>

<svelte:component this={child.component} {...child.props}/>
```

In addition to `child.component` and `child.props`, there is a `child.segment` property which is useful for things like styling:

```diff
<div class="submenu">
-	<a href="settings/profile">Profile</a>
-	<a href="settings/notifications">Notifications</a>
+	<a
+		class={child.segment === "profile" ? "selected" : ""}
+		href="settings/profile"
+	>Profile</a>
+
+	<a
+		class={child.segment === "notifications" ? "selected" : ""}
+		href="settings/notifications"
+	>Notifications</a>
</div>
```


### Preloading

Like page components, layout components can use `preload`:

```html
<!-- src/routes/foo/_layout.html -->
<svelte:component
	this={child.component}
	someData={thingAllChildComponentsWillNeed}
	{...child.props}
/>

<script>
	export default {
		async preload() {
			return {
				thingAllChildComponentsWillNeed: await loadSomeData()
			};
		}
	};
</script>
```