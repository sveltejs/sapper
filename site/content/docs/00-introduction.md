---
제목: 개요
---

### 시작에 앞서

> Sapper의 계승자인 [SvelteKit](https://kit.svelte.dev)는 현재 사용이 가능합니다. 모든 개발 과정은 [SvelteKit](https://kit.svelte.dev)에 입각하여 진행됩니다. 
>
> 도중에 막혔다면 [Discord chatroom](https://svelte.dev/chat)로 도움을 요청하세요. [migration guides](migrating)를 통해서 구 버전을 업그레이드 할 수도 있습니다. 

### Sapper란?

Sapper는 매우 높은 퍼포먼스의 웹앱을 만들 때 사용되는 프레임워크입니다. 바로 여러분들이 보고 있듯이요! 여기엔 두 가지 기본 개념이 있습니다.

* 여러분들의 앱의 각각의 페이지들은 [Svelte](https://svelte.dev) 컴포넌트입니다. 
* 프로젝트 안의 `src/routes` 디렉토리에 파일을 추가함으로서 페이지들을 만들 수 있습니다. 이는 서버에서 렌더링되기 때문에 사용자들이 처음 여러분들의 앱을 방문하였을 시, 클라이언트 사이드 앱보다 훨씬 더 빠르게 이용할 수 있습니다. 

코드 분할, 오프라인 지원, 클라이언트 사이드 수화(hydration)가 곁들여진 서버 사이드 렌더링 뷰 등 현대 기술들을 통해 앱을 만드는 것은 굉장히 복잡합니다. 하지만 Sapper는 이 모든 지루한 것들을 여러분들 대신에 해주기 때문에 여러분들은 좀 더 독창적인 부분에 신경쓸 수 있죠. 

이 가이드를 이해하기 위해서 Svelte를 아실 필요는 없지만 알고 계신다면 도움은 됩니다. 요약하자면, Sapper는 여러분들이 만든 컴포넌트를 최적 성능의 일반 자바스크립트로 변환시켜주는 UI 프레임워크입니다. 자세한 사항은 [introductory blog post](https://svelte.dev/blog/svelte-3-rethinking-reactivity) 및 [tutorial](https://svelte.dev/tutorial)를 참조해주세요. 


### 어디서 이름이 유래되었나요?

전쟁에서 발생할 수 있는 모든 것들에 대비하여 교각 건설, 도로 정비, 지뢰 제거 및 폭발물 설치 등을 담당하는 병사들을 주로 *sappers(공병)*이라고 합니다.

웹 개발자들은 전투 공병들처럼 처절하진 않겠죠. 하지만 여전히 위험한 환경은 주위에 얼마든지 있을 수 있습니다. 동력이 부족한 디바이스, 느린 네트워크 환경 그리고 프론트엔드 공학 속에 도사리고 있는 복잡성 등이 있겠죠. 약어로 <b>S</b>velte <b>app</b> mak<b>er</b>라 불리는 Sapper는 여러분들의 용감하고 든든한 지원군이 될 것입니다.


### Next.js와의 비교

[Next.js](https://github.com/zeit/next.js) 는 [Vercel (formerly ZEIT)](https://vercel.com)에서 비롯된 React 프레임워크이며, 이는 Sapper의 영감이기도 합니다. 하지만 여기에 몇 가지 중요한 차이점들이 존재합니다.

* Sapper는 React 대신 Svelte로 작동하기 때문에 앱 규모는 작으면서 속도는 더욱 빠릅니다.
* *페이지*와 마찬가지로 `src/routes` 디렉토리 안에 *서버 루트*를 만들 수 있습니다. 이는 바로 이런 페이지에 JSON API를 추가하는 등의 작업들을 굉장히 쉽게 할 수 있습니다 (이 사이트를 참조해보세요 [/docs.json](/docs.json))
* 링크들은 프레임워크 내에서만 존재하는 개념인 `<Link>` 컴포넌트가 아닌 단순한 `<a>` 요소들입니다. 다시 말하자면, 저 [this link right here](/)는 비록 마크다운 안에 있는 링크이기는 하지만 여러분들이 생각하는대로 라우터로서 작동을 하게 됩니다.


### 시작해보기

Sapper를 시작하는 가장 쉬운 방법은 [sapper-template](https://github.com/sveltejs/sapper-template) 레포지토리를 [degit](https://github.com/Rich-Harris/degit)로 복제를 하는 것입니다. 

```bash
npx degit "sveltejs/sapper-template#rollup" my-app
# or: npx degit "sveltejs/sapper-template#webpack" my-app
cd my-app
npm install
npm run dev
```

이로써 `my-app` 디렉토리 안에 새로운 프로젝트가 생성되고, 의존성이 설치되며, 서버가 [localhost:3000](http://localhost:3000)에서 시작되게끔 합니다. 파일들을 수정하면서 어떻게 작동을 하는지 한 번 느껴보세요. 이 가이드의 나머지들을 읽을 필요가 없습니다!

#### 타입스크립트 지원 

Sapper는 타입스크립트를 지원합니다. 여러분들이 "시작해보기" 파트에서 소개된 템플렛을 사용하고 있다면, 아래 명령어를 통해 여러분의 프로젝트를 타입스크립트로 손쉽게 바꿔보세요. 

```bash
node scripts/setupTypeScript.js
```
