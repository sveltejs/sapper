// Ordinarily, you'd generate this data from markdown files in your
// repo, or fetch them from a database of some kind. But in order to
// avoid unnecessary dependencies in the starter template, and in the
// service of obviousness, we're just going to leave it here.

// This file is called `_posts.js` rather than `posts.js`, because
// we don't want to create an `/api/blog/posts` route — the leading
// underscore tells Sapper not to do that.

const posts = [
	{
		title: 'What is Sapper?',
		slug: 'what-is-sapper',
		html: `
			<p>First, you have to know what <a href='https://svelte.technology'>Svelte</a> is. Svelte is a UI framework with a bold new idea: rather than providing a library that you write code with (like React or Vue, for example), it's a compiler that turns your components into highly optimized vanilla JavaScript. If you haven't already read the <a href='https://svelte.technology/blog/frameworks-without-the-framework'>introductory blog post</a>, you should!</p>

			<p>Sapper is a Next.js-style framework (<a href='blog/how-is-sapper-different-from-next'>more on that here</a>) built around Svelte. It makes it embarrassingly easy to create extremely high performance web apps. Out of the box, you get:</p>

			<ul>
				<li>Code-splitting, dynamic imports and hot module replacement, powered by webpack</li>
				<li>Server-side rendering (SSR) with client-side hydration</li>
				<li>Service worker for offline support, and all the PWA bells and whistles</li>
				<li>The nicest development experience you've ever had, or your money back</li>
			</ul>

			<p>It's implemented as Express middleware. Everything is set up and waiting for you to get started, but you keep complete control over the server, service worker, webpack config and everything else, so it's as flexible as you need it to be.</p>
		`
	},

	{
		title: 'How to use Sapper',
		slug: 'how-to-use-sapper',
		html: `
			<h2>Step one</h2>
			<p>Create a new project, using <a href='https://github.com/Rich-Harris/degit'>degit</a>:</p>

			<pre><code>npx degit sveltejs/sapper-template my-app
			cd my-app
			npm install # or yarn!
			npm run dev
			</code></pre>

			<h2>Step two</h2>
			<p>Go to <a href='http://localhost:3000'>localhost:3000</a>. Open <code>my-app</code> in your editor. Edit the files in the <code>routes</code> directory or add new ones.</p>

			<h2>Step three</h2>
			<p>...</p>

			<h2>Step four</h2>
			<p>Resist overdone joke formats.</p>
		`
	},

	{
		title: 'Why the name?',
		slug: 'why-the-name',
		html: `
			<p>In war, the soldiers who build bridges, repair roads, clear minefields and conduct demolitions — all under combat conditions — are known as <em>sappers</em>.</p>

			<p>For web developers, the stakes are generally lower than those for combat engineers. But we face our own hostile environment: underpowered devices, poor network connections, and the complexity inherent in front-end engineering. Sapper, which is short for <strong>S</strong>velte <strong>app</strong> mak<strong>er</strong>, is your courageous and dutiful ally.</p>
		`
	},

	{
		title: 'How is Sapper different from Next.js?',
		slug: 'how-is-sapper-different-from-next',
		html: `
			<p><a href='https://github.com/zeit/next.js/'>Next.js</a> is a React framework from <a href='https://zeit.co'>Zeit</a>, and is the inspiration for Sapper. There are a few notable differences, however:</p>

			<ul>
				<li>It's powered by <a href='https://svelte.technology'>Svelte</a> instead of React, so it's faster and your apps are smaller</li>
				<li>Instead of route masking, we encode route parameters in filenames. For example, the page you're looking at right now is <code>routes/blog/[slug].html</code></li>
				<li>As well as pages (Svelte components, which render on server or client), you can create <em>server routes</em> in your <code>routes</code> directory. These are just <code>.js</code> files that export functions corresponding to HTTP methods, and receive Express <code>request</code> and <code>response</code> objects as arguments. This makes it very easy to, for example, add a JSON API such as the one <a href='blog/how-is-sapper-different-from-next.json'>powering this very page</a></li>
				<li>Links are just <code>&lt;a&gt;</code> elements, rather than framework-specific <code>&lt;Link&gt;</code> components. That means, for example, that <a href='blog/how-can-i-get-involved'>this link right here</a>, despite being inside a blob of HTML, works with the router as you'd expect.</li>
			</ul>
		`
	},

	{
		title: 'How can I get involved?',
		slug: 'how-can-i-get-involved',
		html: `
			<p>We're so glad you asked! Come on over to the <a href='https://github.com/sveltejs/svelte'>Svelte</a> and <a href='https://github.com/sveltejs/sapper'>Sapper</a> repos, and join us in the <a href='https://gitter.im/sveltejs/svelte'>Gitter chatroom</a>. Everyone is welcome, especially you!</p>
		`
	},

	{
		title: 'A very long post with deep links',
		slug: 'a-very-long-post',
		html: `
			<h2 id='one'>One</h2>
			<p>I'll have a vodka rocks. (Mom, it's breakfast time.) And a piece of toast. Let me out that Queen. Fried cheese… with club sauce.</p>
			<p>Her lawyers are claiming the seal is worth $250,000. And that's not even including Buster's Swatch. This was a big get for God. What, so the guy we are meeting with can't even grow his own hair? COME ON! She's always got to wedge herself in the middle of us so that she can control everything. Yeah. Mom's awesome. It's, like, Hey, you want to go down to the whirlpool? Yeah, I don't have a husband. I call it Swing City. The CIA should've just Googled for his hideout, evidently. There are dozens of us! DOZENS! Yeah, like I'm going to take a whiz through this $5,000 suit. COME ON.</p>

			<h2 id='two'>Two</h2>
			<p>Tobias Fünke costume. Heart attack never stopped old big bear.</p>
			<p>Nellie is blowing them all AWAY. I will be a bigger and hairier mole than the one on your inner left thigh! I'll sacrifice anything for my children.</p>
			<p>Up yours, granny! You couldn't handle it! Hey, Dad. Look at you. You're a year older…and a year closer to death. Buster: Oh yeah, I guess that's kind of funny. Bob Loblaw Law Blog. The guy runs a prison, he can have any piece of ass he wants.</p>

			<h2 id='three'>Three</h2>
			<p>I prematurely shot my wad on what was supposed to be a dry run, so now I'm afraid I have something of a mess on my hands. Dead Dove DO NOT EAT. Never once touched my per diem. I'd go to Craft Service, get some raw veggies, bacon, Cup-A-Soup…baby, I got a stew goin'. You're losing blood, aren't you? Gob: Probably, my socks are wet. Sure, let the little fruit do it. HUZZAH! Although George Michael had only got to second base, he'd gone in head first, like Pete Rose. I will pack your sweet pink mouth with so much ice cream you'll be the envy of every Jerry and Jane on the block!</p>
			<p>Gosh Mom… after all these years, God's not going to take a call from you. Come on, this is a Bluth family celebration. It's no place for children.</p>
			<p>And I wouldn't just lie there, if that's what you're thinking. That's not what I WAS thinking. Who? i just dont want him to point out my cracker ass in front of ann. When a man needs to prove to a woman that he's actually… When a man loves a woman… Heyyyyyy Uncle Father Oscar. [Stabbing Gob] White power! Gob: I'm white! Let me take off my assistant's skirt and put on my Barbra-Streisand-in-The-Prince-of-Tides ass-masking therapist pantsuit. In the mid '90s, Tobias formed a folk music band with Lindsay and Maebe which he called Dr. Funke's 100 Percent Natural Good Time Family Band Solution. The group was underwritten by the Natural Food Life Company, a division of Chem-Grow, an Allen Crayne acqusition, which was part of the Squimm Group. Their motto was simple: We keep you alive.</p>

			<h2 id='four'>Four</h2>
			<p>If you didn't have adult onset diabetes, I wouldn't mind giving you a little sugar. Everybody dance NOW. And the soup of the day is bread. Great, now I'm gonna smell to high heaven like a tuna melt!</p>
			<p>That's how Tony Wonder lost a nut. She calls it a Mayonegg. Go ahead, touch the Cornballer. There's a new daddy in town. A discipline daddy.</p>
		`
	},

	{
		title: 'Encödïng test',
		slug: 'encödïng-test',
		html: `
			<p>It works</p>
		`
	}
];

posts.forEach(post => {
	post.html = post.html.replace(/^\t{3}/gm, '');
});

export default posts;