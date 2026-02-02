const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

// Tailwind CSS 임포트를 처리하는 플러그인
const tailwindPlugin = {
  name: 'tailwind-plugin',
  setup(build) {
    // CSS 파일 처리
    build.onResolve({ filter: /\.css$/ }, (args) => {
      if (args.path === '../../src/app/globals.css') {
        return {
          path: path.resolve('src/app/globals.css'),
          namespace: 'css'
        };
      }
      return null;
    });

    // CSS 내용 처리
    build.onLoad({ filter: /.*/, namespace: 'css' }, async (args) => {
      const cssContent = fs.readFileSync(args.path, 'utf8');

      // Tailwind CSS imports를 실제 CSS로 변환 (간단한 처리)
      let processedCSS = cssContent;

      // @import "tailwindcss"를 기본 Tailwind reset과 utilities로 대체
      if (processedCSS.includes('@import "tailwindcss"')) {
        const tailwindBase = `
/* Tailwind CSS Base */
*, ::before, ::after { box-sizing: border-box; border-width: 0; border-style: solid; border-color: #e5e7eb; }
::before, ::after { --tw-content: ''; }
html { line-height: 1.5; -webkit-text-size-adjust: 100%; -moz-tab-size: 4; tab-size: 4; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"; font-feature-settings: normal; font-variation-settings: normal; }
body { margin: 0; line-height: inherit; }
hr { height: 0; color: inherit; border-top-width: 1px; }
abbr:where([title]) { text-decoration: underline dotted; }
h1, h2, h3, h4, h5, h6 { font-size: inherit; font-weight: inherit; }
a { color: inherit; text-decoration: inherit; }
b, strong { font-weight: bolder; }
code, kbd, samp, pre { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size: 1em; }
small { font-size: 80%; }
sub, sup { font-size: 75%; line-height: 0; position: relative; vertical-align: baseline; }
sub { bottom: -0.25em; }
sup { top: -0.5em; }
table { text-indent: 0; border-color: inherit; border-collapse: collapse; }
button, input, optgroup, select, textarea { font-family: inherit; font-size: 100%; font-weight: inherit; line-height: inherit; color: inherit; margin: 0; padding: 0; }
button, select { text-transform: none; }
button, [type='button'], [type='reset'], [type='submit'] { -webkit-appearance: button; background-color: transparent; background-image: none; }
:-moz-focusring { outline: auto; }
:-moz-ui-invalid { box-shadow: none; }
progress { vertical-align: baseline; }
::-webkit-inner-spin-button, ::-webkit-outer-spin-button { height: auto; }
[type='search'] { -webkit-appearance: textfield; outline-offset: -2px; }
::-webkit-search-decoration { -webkit-appearance: none; }
::-webkit-file-upload-button { -webkit-appearance: button; font: inherit; }
summary { display: list-item; }
blockquote, dl, dd, h1, h2, h3, h4, h5, h6, hr, figure, p, pre { margin: 0; }
fieldset { margin: 0; padding: 0; }
legend { padding: 0; }
ol, ul, menu { list-style: none; margin: 0; padding: 0; }
textarea { resize: vertical; }
input::placeholder, textarea::placeholder { opacity: 1; color: #9ca3af; }
button, [role="button"] { cursor: pointer; }
:disabled { cursor: default; }
img, svg, video, canvas, audio, iframe, embed, object { display: block; vertical-align: middle; }
img, video { max-width: 100%; height: auto; }

/* Tailwind CSS Utilities */
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0; }
.visible { visibility: visible; }
.invisible { visibility: hidden; }
.static { position: static; }
.fixed { position: fixed; }
.absolute { position: absolute; }
.relative { position: relative; }
.sticky { position: sticky; }
.block { display: block; }
.inline-block { display: inline-block; }
.inline { display: inline; }
.flex { display: flex; }
.inline-flex { display: inline-flex; }
.table { display: table; }
.inline-table { display: inline-table; }
.table-caption { display: table-caption; }
.table-cell { display: table-cell; }
.table-column { display: table-column; }
.table-column-group { display: table-column-group; }
.table-footer-group { display: table-footer-group; }
.table-header-group { display: table-header-group; }
.table-row-group { display: table-row-group; }
.table-row { display: table-row; }
.flow-root { display: flow-root; }
.grid { display: grid; }
.inline-grid { display: inline-grid; }
.contents { display: contents; }
.list-item { display: list-item; }
.hidden { display: none; }
.w-1 { width: 0.25rem; }
.w-2 { width: 0.5rem; }
.w-3 { width: 0.75rem; }
.w-4 { width: 1rem; }
.w-5 { width: 1.25rem; }
.w-6 { width: 1.5rem; }
.w-7 { width: 1.75rem; }
.w-8 { width: 2rem; }
.w-9 { width: 2.25rem; }
.w-10 { width: 2.5rem; }
.w-11 { width: 2.75rem; }
.w-12 { width: 3rem; }
.w-14 { width: 3.5rem; }
.w-16 { width: 4rem; }
.w-20 { width: 5rem; }
.w-24 { width: 6rem; }
.w-28 { width: 7rem; }
.w-32 { width: 8rem; }
.w-36 { width: 9rem; }
.w-40 { width: 10rem; }
.w-44 { width: 11rem; }
.w-48 { width: 12rem; }
.w-52 { width: 13rem; }
.w-56 { width: 14rem; }
.w-60 { width: 15rem; }
.w-64 { width: 16rem; }
.w-72 { width: 18rem; }
.w-80 { width: 20rem; }
.w-96 { width: 24rem; }
.w-auto { width: auto; }
.w-px { width: 1px; }
.w-0\\.5 { width: 0.125rem; }
.w-1\\.5 { width: 0.375rem; }
.w-2\\.5 { width: 0.625rem; }
.w-3\\.5 { width: 0.875rem; }
.w-1\\/2 { width: 50%; }
.w-1\\/3 { width: 33.333333%; }
.w-2\\/3 { width: 66.666667%; }
.w-1\\/4 { width: 25%; }
.w-2\\/4 { width: 50%; }
.w-3\\/4 { width: 75%; }
.w-1\\/5 { width: 20%; }
.w-2\\/5 { width: 40%; }
.w-3\\/5 { width: 60%; }
.w-4\\/5 { width: 80%; }
.w-1\\/6 { width: 16.666667%; }
.w-2\\/6 { width: 33.333333%; }
.w-3\\/6 { width: 50%; }
.w-4\\/6 { width: 66.666667%; }
.w-5\\/6 { width: 83.333333%; }
.w-1\\/12 { width: 8.333333%; }
.w-2\\/12 { width: 16.666667%; }
.w-3\\/12 { width: 25%; }
.w-4\\/12 { width: 33.333333%; }
.w-5\\/12 { width: 41.666667%; }
.w-6\\/12 { width: 50%; }
.w-7\\/12 { width: 58.333333%; }
.w-8\\/12 { width: 66.666667%; }
.w-9\\/12 { width: 75%; }
.w-10\\/12 { width: 83.333333%; }
.w-11\\/12 { width: 91.666667%; }
.w-full { width: 100%; }
.w-screen { width: 100vw; }
.w-min { width: min-content; }
.w-max { width: max-content; }
.w-fit { width: fit-content; }

.h-1 { height: 0.25rem; }
.h-2 { height: 0.5rem; }
.h-3 { height: 0.75rem; }
.h-4 { height: 1rem; }
.h-5 { height: 1.25rem; }
.h-6 { height: 1.5rem; }
.h-7 { height: 1.75rem; }
.h-8 { height: 2rem; }
.h-9 { height: 2.25rem; }
.h-10 { height: 2.5rem; }
.h-11 { height: 2.75rem; }
.h-12 { height: 3rem; }
.h-14 { height: 3.5rem; }
.h-16 { height: 4rem; }
.h-20 { height: 5rem; }
.h-24 { height: 6rem; }
.h-28 { height: 7rem; }
.h-32 { height: 8rem; }
.h-36 { height: 9rem; }
.h-40 { height: 10rem; }
.h-44 { height: 11rem; }
.h-48 { height: 12rem; }
.h-52 { height: 13rem; }
.h-56 { height: 14rem; }
.h-60 { height: 15rem; }
.h-64 { height: 16rem; }
.h-72 { height: 18rem; }
.h-80 { height: 20rem; }
.h-96 { height: 24rem; }
.h-auto { height: auto; }
.h-px { height: 1px; }
.h-0\\.5 { height: 0.125rem; }
.h-1\\.5 { height: 0.375rem; }
.h-2\\.5 { height: 0.625rem; }
.h-3\\.5 { height: 0.875rem; }
.h-1\\/2 { height: 50%; }
.h-1\\/3 { height: 33.333333%; }
.h-2\\/3 { height: 66.666667%; }
.h-1\\/4 { height: 25%; }
.h-2\\/4 { height: 50%; }
.h-3\\/4 { height: 75%; }
.h-1\\/5 { height: 20%; }
.h-2\\/5 { height: 40%; }
.h-3\\/5 { height: 60%; }
.h-4\\/5 { height: 80%; }
.h-1\\/6 { height: 16.666667%; }
.h-2\\/6 { height: 33.333333%; }
.h-3\\/6 { height: 50%; }
.h-4\\/6 { height: 66.666667%; }
.h-5\\/6 { height: 83.333333%; }
.h-full { height: 100%; }
.h-screen { height: 100vh; }
.h-min { height: min-content; }
.h-max { height: max-content; }
.h-fit { height: fit-content; }

.min-h-0 { min-height: 0px; }
.min-h-full { min-height: 100%; }
.min-h-screen { min-height: 100vh; }
.min-h-min { min-height: min-content; }
.min-h-max { min-height: max-content; }
.min-h-fit { min-height: fit-content; }

.max-w-none { max-width: none; }
.max-w-xs { max-width: 20rem; }
.max-w-sm { max-width: 24rem; }
.max-w-md { max-width: 28rem; }
.max-w-lg { max-width: 32rem; }
.max-w-xl { max-width: 36rem; }
.max-w-2xl { max-width: 42rem; }
.max-w-3xl { max-width: 48rem; }
.max-w-4xl { max-width: 56rem; }
.max-w-5xl { max-width: 64rem; }
.max-w-6xl { max-width: 72rem; }
.max-w-7xl { max-width: 80rem; }
.max-w-full { max-width: 100%; }
.max-w-min { max-width: min-content; }
.max-w-max { max-width: max-content; }
.max-w-fit { max-width: fit-content; }
.max-w-prose { max-width: 65ch; }
.max-w-screen-sm { max-width: 640px; }
.max-w-screen-md { max-width: 768px; }
.max-w-screen-lg { max-width: 1024px; }
.max-w-screen-xl { max-width: 1280px; }
.max-w-screen-2xl { max-width: 1536px; }

.flex-1 { flex: 1 1 0%; }
.flex-auto { flex: 1 1 auto; }
.flex-initial { flex: 0 1 auto; }
.flex-none { flex: none; }

.flex-col { flex-direction: column; }
.flex-col-reverse { flex-direction: column-reverse; }
.flex-row { flex-direction: row; }
.flex-row-reverse { flex-direction: row-reverse; }

.flex-wrap { flex-wrap: wrap; }
.flex-wrap-reverse { flex-wrap: wrap-reverse; }
.flex-nowrap { flex-wrap: nowrap; }

.items-start { align-items: flex-start; }
.items-end { align-items: flex-end; }
.items-center { align-items: center; }
.items-baseline { align-items: baseline; }
.items-stretch { align-items: stretch; }

.justify-start { justify-content: flex-start; }
.justify-end { justify-content: flex-end; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.justify-around { justify-content: space-around; }
.justify-evenly { justify-content: space-evenly; }

.gap-0 { gap: 0px; }
.gap-x-0 { column-gap: 0px; }
.gap-y-0 { row-gap: 0px; }
.gap-px { gap: 1px; }
.gap-x-px { column-gap: 1px; }
.gap-y-px { row-gap: 1px; }
.gap-0\\.5 { gap: 0.125rem; }
.gap-x-0\\.5 { column-gap: 0.125rem; }
.gap-y-0\\.5 { row-gap: 0.125rem; }
.gap-1 { gap: 0.25rem; }
.gap-x-1 { column-gap: 0.25rem; }
.gap-y-1 { row-gap: 0.25rem; }
.gap-1\\.5 { gap: 0.375rem; }
.gap-x-1\\.5 { column-gap: 0.375rem; }
.gap-y-1\\.5 { row-gap: 0.375rem; }
.gap-2 { gap: 0.5rem; }
.gap-x-2 { column-gap: 0.5rem; }
.gap-y-2 { row-gap: 0.5rem; }
.gap-2\\.5 { gap: 0.625rem; }
.gap-x-2\\.5 { column-gap: 0.625rem; }
.gap-y-2\\.5 { row-gap: 0.625rem; }
.gap-3 { gap: 0.75rem; }
.gap-x-3 { column-gap: 0.75rem; }
.gap-y-3 { row-gap: 0.75rem; }
.gap-3\\.5 { gap: 0.875rem; }
.gap-x-3\\.5 { column-gap: 0.875rem; }
.gap-y-3\\.5 { row-gap: 0.875rem; }
.gap-4 { gap: 1rem; }
.gap-x-4 { column-gap: 1rem; }
.gap-y-4 { row-gap: 1rem; }
.gap-5 { gap: 1.25rem; }
.gap-x-5 { column-gap: 1.25rem; }
.gap-y-5 { row-gap: 1.25rem; }
.gap-6 { gap: 1.5rem; }
.gap-x-6 { column-gap: 1.5rem; }
.gap-y-6 { row-gap: 1.5rem; }
.gap-7 { gap: 1.75rem; }
.gap-x-7 { column-gap: 1.75rem; }
.gap-y-7 { row-gap: 1.75rem; }
.gap-8 { gap: 2rem; }
.gap-x-8 { column-gap: 2rem; }
.gap-y-8 { row-gap: 2rem; }
.gap-9 { gap: 2.25rem; }
.gap-x-9 { column-gap: 2.25rem; }
.gap-y-9 { row-gap: 2.25rem; }
.gap-10 { gap: 2.5rem; }
.gap-x-10 { column-gap: 2.5rem; }
.gap-y-10 { row-gap: 2.5rem; }
.gap-11 { gap: 2.75rem; }
.gap-x-11 { column-gap: 2.75rem; }
.gap-y-11 { row-gap: 2.75rem; }
.gap-12 { gap: 3rem; }
.gap-x-12 { column-gap: 3rem; }
.gap-y-12 { row-gap: 3rem; }
.gap-14 { gap: 3.5rem; }
.gap-x-14 { column-gap: 3.5rem; }
.gap-y-14 { row-gap: 3.5rem; }
.gap-16 { gap: 4rem; }
.gap-x-16 { column-gap: 4rem; }
.gap-y-16 { row-gap: 4rem; }
.gap-20 { gap: 5rem; }
.gap-x-20 { column-gap: 5rem; }
.gap-y-20 { row-gap: 5rem; }
.gap-24 { gap: 6rem; }
.gap-x-24 { column-gap: 6rem; }
.gap-y-24 { row-gap: 6rem; }
.gap-28 { gap: 7rem; }
.gap-x-28 { column-gap: 7rem; }
.gap-y-28 { row-gap: 7rem; }
.gap-32 { gap: 8rem; }
.gap-x-32 { column-gap: 8rem; }
.gap-y-32 { row-gap: 8rem; }
.gap-36 { gap: 9rem; }
.gap-x-36 { column-gap: 9rem; }
.gap-y-36 { row-gap: 9rem; }
.gap-40 { gap: 10rem; }
.gap-x-40 { column-gap: 10rem; }
.gap-y-40 { row-gap: 10rem; }
.gap-44 { gap: 11rem; }
.gap-x-44 { column-gap: 11rem; }
.gap-y-44 { row-gap: 11rem; }
.gap-48 { gap: 12rem; }
.gap-x-48 { column-gap: 12rem; }
.gap-y-48 { row-gap: 12rem; }
.gap-52 { gap: 13rem; }
.gap-x-52 { column-gap: 13rem; }
.gap-y-52 { row-gap: 13rem; }
.gap-56 { gap: 14rem; }
.gap-x-56 { column-gap: 14rem; }
.gap-y-56 { row-gap: 14rem; }
.gap-60 { gap: 15rem; }
.gap-x-60 { column-gap: 15rem; }
.gap-y-60 { row-gap: 15rem; }
.gap-64 { gap: 16rem; }
.gap-x-64 { column-gap: 16rem; }
.gap-y-64 { row-gap: 16rem; }
.gap-72 { gap: 18rem; }
.gap-x-72 { column-gap: 18rem; }
.gap-y-72 { row-gap: 18rem; }
.gap-80 { gap: 20rem; }
.gap-x-80 { column-gap: 20rem; }
.gap-y-80 { row-gap: 20rem; }
.gap-96 { gap: 24rem; }
.gap-x-96 { column-gap: 24rem; }
.gap-y-96 { row-gap: 24rem; }

.p-0 { padding: 0px; }
.p-px { padding: 1px; }
.p-0\\.5 { padding: 0.125rem; }
.p-1 { padding: 0.25rem; }
.p-1\\.5 { padding: 0.375rem; }
.p-2 { padding: 0.5rem; }
.p-2\\.5 { padding: 0.625rem; }
.p-3 { padding: 0.75rem; }
.p-3\\.5 { padding: 0.875rem; }
.p-4 { padding: 1rem; }
.p-5 { padding: 1.25rem; }
.p-6 { padding: 1.5rem; }
.p-7 { padding: 1.75rem; }
.p-8 { padding: 2rem; }
.p-9 { padding: 2.25rem; }
.p-10 { padding: 2.5rem; }
.p-11 { padding: 2.75rem; }
.p-12 { padding: 3rem; }
.p-14 { padding: 3.5rem; }
.p-16 { padding: 4rem; }
.p-20 { padding: 5rem; }
.p-24 { padding: 6rem; }
.p-28 { padding: 7rem; }
.p-32 { padding: 8rem; }
.p-36 { padding: 9rem; }
.p-40 { padding: 10rem; }
.p-44 { padding: 11rem; }
.p-48 { padding: 12rem; }
.p-52 { padding: 13rem; }
.p-56 { padding: 14rem; }
.p-60 { padding: 15rem; }
.p-64 { padding: 16rem; }
.p-72 { padding: 18rem; }
.p-80 { padding: 20rem; }
.p-96 { padding: 24rem; }

.px-0 { padding-left: 0px; padding-right: 0px; }
.px-px { padding-left: 1px; padding-right: 1px; }
.px-0\\.5 { padding-left: 0.125rem; padding-right: 0.125rem; }
.px-1 { padding-left: 0.25rem; padding-right: 0.25rem; }
.px-1\\.5 { padding-left: 0.375rem; padding-right: 0.375rem; }
.px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
.px-2\\.5 { padding-left: 0.625rem; padding-right: 0.625rem; }
.px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
.px-3\\.5 { padding-left: 0.875rem; padding-right: 0.875rem; }
.px-4 { padding-left: 1rem; padding-right: 1rem; }
.px-5 { padding-left: 1.25rem; padding-right: 1.25rem; }
.px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
.px-7 { padding-left: 1.75rem; padding-right: 1.75rem; }
.px-8 { padding-left: 2rem; padding-right: 2rem; }
.px-9 { padding-left: 2.25rem; padding-right: 2.25rem; }
.px-10 { padding-left: 2.5rem; padding-right: 2.5rem; }
.px-11 { padding-left: 2.75rem; padding-right: 2.75rem; }
.px-12 { padding-left: 3rem; padding-right: 3rem; }
.px-14 { padding-left: 3.5rem; padding-right: 3.5rem; }
.px-16 { padding-left: 4rem; padding-right: 4rem; }
.px-20 { padding-left: 5rem; padding-right: 5rem; }
.px-24 { padding-left: 6rem; padding-right: 6rem; }
.px-28 { padding-left: 7rem; padding-right: 7rem; }
.px-32 { padding-left: 8rem; padding-right: 8rem; }
.px-36 { padding-left: 9rem; padding-right: 9rem; }
.px-40 { padding-left: 10rem; padding-right: 10rem; }
.px-44 { padding-left: 11rem; padding-right: 11rem; }
.px-48 { padding-left: 12rem; padding-right: 12rem; }
.px-52 { padding-left: 13rem; padding-right: 13rem; }
.px-56 { padding-left: 14rem; padding-right: 14rem; }
.px-60 { padding-left: 15rem; padding-right: 15rem; }
.px-64 { padding-left: 16rem; padding-right: 16rem; }
.px-72 { padding-left: 18rem; padding-right: 18rem; }
.px-80 { padding-left: 20rem; padding-right: 20rem; }
.px-96 { padding-left: 24rem; padding-right: 24rem; }

.py-0 { padding-top: 0px; padding-bottom: 0px; }
.py-px { padding-top: 1px; padding-bottom: 1px; }
.py-0\\.5 { padding-top: 0.125rem; padding-bottom: 0.125rem; }
.py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
.py-1\\.5 { padding-top: 0.375rem; padding-bottom: 0.375rem; }
.py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
.py-2\\.5 { padding-top: 0.625rem; padding-bottom: 0.625rem; }
.py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
.py-3\\.5 { padding-top: 0.875rem; padding-bottom: 0.875rem; }
.py-4 { padding-top: 1rem; padding-bottom: 1rem; }
.py-5 { padding-top: 1.25rem; padding-bottom: 1.25rem; }
.py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
.py-7 { padding-top: 1.75rem; padding-bottom: 1.75rem; }
.py-8 { padding-top: 2rem; padding-bottom: 2rem; }
.py-9 { padding-top: 2.25rem; padding-bottom: 2.25rem; }
.py-10 { padding-top: 2.5rem; padding-bottom: 2.5rem; }
.py-11 { padding-top: 2.75rem; padding-bottom: 2.75rem; }
.py-12 { padding-top: 3rem; padding-bottom: 3rem; }
.py-14 { padding-top: 3.5rem; padding-bottom: 3.5rem; }
.py-16 { padding-top: 4rem; padding-bottom: 4rem; }
.py-20 { padding-top: 5rem; padding-bottom: 5rem; }
.py-24 { padding-top: 6rem; padding-bottom: 6rem; }
.py-28 { padding-top: 7rem; padding-bottom: 7rem; }
.py-32 { padding-top: 8rem; padding-bottom: 8rem; }
.py-36 { padding-top: 9rem; padding-bottom: 9rem; }
.py-40 { padding-top: 10rem; padding-bottom: 10rem; }
.py-44 { padding-top: 11rem; padding-bottom: 11rem; }
.py-48 { padding-top: 12rem; padding-bottom: 12rem; }
.py-52 { padding-top: 13rem; padding-bottom: 13rem; }
.py-56 { padding-top: 14rem; padding-bottom: 14rem; }
.py-60 { padding-top: 15rem; padding-bottom: 15rem; }
.py-64 { padding-top: 16rem; padding-bottom: 16rem; }
.py-72 { padding-top: 18rem; padding-bottom: 18rem; }
.py-80 { padding-top: 20rem; padding-bottom: 20rem; }
.py-96 { padding-top: 24rem; padding-bottom: 24rem; }

.m-0 { margin: 0px; }
.m-px { margin: 1px; }
.m-0\\.5 { margin: 0.125rem; }
.m-1 { margin: 0.25rem; }
.m-1\\.5 { margin: 0.375rem; }
.m-2 { margin: 0.5rem; }
.m-2\\.5 { margin: 0.625rem; }
.m-3 { margin: 0.75rem; }
.m-3\\.5 { margin: 0.875rem; }
.m-4 { margin: 1rem; }
.m-5 { margin: 1.25rem; }
.m-6 { margin: 1.5rem; }
.m-7 { margin: 1.75rem; }
.m-8 { margin: 2rem; }
.m-9 { margin: 2.25rem; }
.m-10 { margin: 2.5rem; }
.m-11 { margin: 2.75rem; }
.m-12 { margin: 3rem; }
.m-14 { margin: 3.5rem; }
.m-16 { margin: 4rem; }
.m-20 { margin: 5rem; }
.m-24 { margin: 6rem; }
.m-28 { margin: 7rem; }
.m-32 { margin: 8rem; }
.m-36 { margin: 9rem; }
.m-40 { margin: 10rem; }
.m-44 { margin: 11rem; }
.m-48 { margin: 12rem; }
.m-52 { margin: 13rem; }
.m-56 { margin: 14rem; }
.m-60 { margin: 15rem; }
.m-64 { margin: 16rem; }
.m-72 { margin: 18rem; }
.m-80 { margin: 20rem; }
.m-96 { margin: 24rem; }
.m-auto { margin: auto; }

.mx-0 { margin-left: 0px; margin-right: 0px; }
.mx-px { margin-left: 1px; margin-right: 1px; }
.mx-0\\.5 { margin-left: 0.125rem; margin-right: 0.125rem; }
.mx-1 { margin-left: 0.25rem; margin-right: 0.25rem; }
.mx-1\\.5 { margin-left: 0.375rem; margin-right: 0.375rem; }
.mx-2 { margin-left: 0.5rem; margin-right: 0.5rem; }
.mx-2\\.5 { margin-left: 0.625rem; margin-right: 0.625rem; }
.mx-3 { margin-left: 0.75rem; margin-right: 0.75rem; }
.mx-3\\.5 { margin-left: 0.875rem; margin-right: 0.875rem; }
.mx-4 { margin-left: 1rem; margin-right: 1rem; }
.mx-5 { margin-left: 1.25rem; margin-right: 1.25rem; }
.mx-6 { margin-left: 1.5rem; margin-right: 1.5rem; }
.mx-7 { margin-left: 1.75rem; margin-right: 1.75rem; }
.mx-8 { margin-left: 2rem; margin-right: 2rem; }
.mx-9 { margin-left: 2.25rem; margin-right: 2.25rem; }
.mx-10 { margin-left: 2.5rem; margin-right: 2.5rem; }
.mx-11 { margin-left: 2.75rem; margin-right: 2.75rem; }
.mx-12 { margin-left: 3rem; margin-right: 3rem; }
.mx-14 { margin-left: 3.5rem; margin-right: 3.5rem; }
.mx-16 { margin-left: 4rem; margin-right: 4rem; }
.mx-20 { margin-left: 5rem; margin-right: 5rem; }
.mx-24 { margin-left: 6rem; margin-right: 6rem; }
.mx-28 { margin-left: 7rem; margin-right: 7rem; }
.mx-32 { margin-left: 8rem; margin-right: 8rem; }
.mx-36 { margin-left: 9rem; margin-right: 9rem; }
.mx-40 { margin-left: 10rem; margin-right: 10rem; }
.mx-44 { margin-left: 11rem; margin-right: 11rem; }
.mx-48 { margin-left: 12rem; margin-right: 12rem; }
.mx-52 { margin-left: 13rem; margin-right: 13rem; }
.mx-56 { margin-left: 14rem; margin-right: 14rem; }
.mx-60 { margin-left: 15rem; margin-right: 15rem; }
.mx-64 { margin-left: 16rem; margin-right: 16rem; }
.mx-72 { margin-left: 18rem; margin-right: 18rem; }
.mx-80 { margin-left: 20rem; margin-right: 20rem; }
.mx-96 { margin-left: 24rem; margin-right: 24rem; }
.mx-auto { margin-left: auto; margin-right: auto; }

.my-0 { margin-top: 0px; margin-bottom: 0px; }
.my-px { margin-top: 1px; margin-bottom: 1px; }
.my-0\\.5 { margin-top: 0.125rem; margin-bottom: 0.125rem; }
.my-1 { margin-top: 0.25rem; margin-bottom: 0.25rem; }
.my-1\\.5 { margin-top: 0.375rem; margin-bottom: 0.375rem; }
.my-2 { margin-top: 0.5rem; margin-bottom: 0.5rem; }
.my-2\\.5 { margin-top: 0.625rem; margin-bottom: 0.625rem; }
.my-3 { margin-top: 0.75rem; margin-bottom: 0.75rem; }
.my-3\\.5 { margin-top: 0.875rem; margin-bottom: 0.875rem; }
.my-4 { margin-top: 1rem; margin-bottom: 1rem; }
.my-5 { margin-top: 1.25rem; margin-bottom: 1.25rem; }
.my-6 { margin-top: 1.5rem; margin-bottom: 1.5rem; }
.my-7 { margin-top: 1.75rem; margin-bottom: 1.75rem; }
.my-8 { margin-top: 2rem; margin-bottom: 2rem; }
.my-9 { margin-top: 2.25rem; margin-bottom: 2.25rem; }
.my-10 { margin-top: 2.5rem; margin-bottom: 2.5rem; }
.my-11 { margin-top: 2.75rem; margin-bottom: 2.75rem; }
.my-12 { margin-top: 3rem; margin-bottom: 3rem; }
.my-14 { margin-top: 3.5rem; margin-bottom: 3.5rem; }
.my-16 { margin-top: 4rem; margin-bottom: 4rem; }
.my-20 { margin-top: 5rem; margin-bottom: 5rem; }
.my-24 { margin-top: 6rem; margin-bottom: 6rem; }
.my-28 { margin-top: 7rem; margin-bottom: 7rem; }
.my-32 { margin-top: 8rem; margin-bottom: 8rem; }
.my-36 { margin-top: 9rem; margin-bottom: 9rem; }
.my-40 { margin-top: 10rem; margin-bottom: 10rem; }
.my-44 { margin-top: 11rem; margin-bottom: 11rem; }
.my-48 { margin-top: 12rem; margin-bottom: 12rem; }
.my-52 { margin-top: 13rem; margin-bottom: 13rem; }
.my-56 { margin-top: 14rem; margin-bottom: 14rem; }
.my-60 { margin-top: 15rem; margin-bottom: 15rem; }
.my-64 { margin-top: 16rem; margin-bottom: 16rem; }
.my-72 { margin-top: 18rem; margin-bottom: 18rem; }
.my-80 { margin-top: 20rem; margin-bottom: 20rem; }
.my-96 { margin-top: 24rem; margin-bottom: 24rem; }
.my-auto { margin-top: auto; margin-bottom: auto; }

.mb-0 { margin-bottom: 0px; }
.mb-px { margin-bottom: 1px; }
.mb-0\\.5 { margin-bottom: 0.125rem; }
.mb-1 { margin-bottom: 0.25rem; }
.mb-1\\.5 { margin-bottom: 0.375rem; }
.mb-2 { margin-bottom: 0.5rem; }
.mb-2\\.5 { margin-bottom: 0.625rem; }
.mb-3 { margin-bottom: 0.75rem; }
.mb-3\\.5 { margin-bottom: 0.875rem; }
.mb-4 { margin-bottom: 1rem; }
.mb-5 { margin-bottom: 1.25rem; }
.mb-6 { margin-bottom: 1.5rem; }
.mb-7 { margin-bottom: 1.75rem; }
.mb-8 { margin-bottom: 2rem; }
.mb-9 { margin-bottom: 2.25rem; }
.mb-10 { margin-bottom: 2.5rem; }
.mb-11 { margin-bottom: 2.75rem; }
.mb-12 { margin-bottom: 3rem; }
.mb-14 { margin-bottom: 3.5rem; }
.mb-16 { margin-bottom: 4rem; }
.mb-20 { margin-bottom: 5rem; }
.mb-24 { margin-bottom: 6rem; }
.mb-28 { margin-bottom: 7rem; }
.mb-32 { margin-bottom: 8rem; }
.mb-36 { margin-bottom: 9rem; }
.mb-40 { margin-bottom: 10rem; }
.mb-44 { margin-bottom: 11rem; }
.mb-48 { margin-bottom: 12rem; }
.mb-52 { margin-bottom: 13rem; }
.mb-56 { margin-bottom: 14rem; }
.mb-60 { margin-bottom: 15rem; }
.mb-64 { margin-bottom: 16rem; }
.mb-72 { margin-bottom: 18rem; }
.mb-80 { margin-bottom: 20rem; }
.mb-96 { margin-bottom: 24rem; }
.mb-auto { margin-bottom: auto; }

.text-xs { font-size: 0.75rem; line-height: 1rem; }
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }
.text-base { font-size: 1rem; line-height: 1.5rem; }
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }
.text-2xl { font-size: 1.5rem; line-height: 2rem; }
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
.text-4xl { font-size: 2.25rem; line-height: 2.5rem; }
.text-5xl { font-size: 3rem; line-height: 1; }
.text-6xl { font-size: 3.75rem; line-height: 1; }
.text-7xl { font-size: 4.5rem; line-height: 1; }
.text-8xl { font-size: 6rem; line-height: 1; }
.text-9xl { font-size: 8rem; line-height: 1; }

.font-thin { font-weight: 100; }
.font-extralight { font-weight: 200; }
.font-light { font-weight: 300; }
.font-normal { font-weight: 400; }
.font-medium { font-weight: 500; }
.font-semibold { font-weight: 600; }
.font-bold { font-weight: 700; }
.font-extrabold { font-weight: 800; }
.font-black { font-weight: 900; }

.leading-3 { line-height: .75rem; }
.leading-4 { line-height: 1rem; }
.leading-5 { line-height: 1.25rem; }
.leading-6 { line-height: 1.5rem; }
.leading-7 { line-height: 1.75rem; }
.leading-8 { line-height: 2rem; }
.leading-9 { line-height: 2.25rem; }
.leading-10 { line-height: 2.5rem; }
.leading-none { line-height: 1; }
.leading-tight { line-height: 1.25; }
.leading-snug { line-height: 1.375; }
.leading-normal { line-height: 1.5; }
.leading-relaxed { line-height: 1.625; }
.leading-loose { line-height: 2; }

.text-left { text-align: left; }
.text-center { text-align: center; }
.text-right { text-align: right; }
.text-justify { text-align: justify; }

.text-black { --tw-text-opacity: 1; color: rgb(0 0 0 / var(--tw-text-opacity)); }
.text-white { --tw-text-opacity: 1; color: rgb(255 255 255 / var(--tw-text-opacity)); }
.text-slate-50 { --tw-text-opacity: 1; color: rgb(248 250 252 / var(--tw-text-opacity)); }
.text-slate-100 { --tw-text-opacity: 1; color: rgb(241 245 249 / var(--tw-text-opacity)); }
.text-slate-200 { --tw-text-opacity: 1; color: rgb(226 232 240 / var(--tw-text-opacity)); }
.text-slate-300 { --tw-text-opacity: 1; color: rgb(203 213 225 / var(--tw-text-opacity)); }
.text-slate-400 { --tw-text-opacity: 1; color: rgb(148 163 184 / var(--tw-text-opacity)); }
.text-slate-500 { --tw-text-opacity: 1; color: rgb(100 116 139 / var(--tw-text-opacity)); }
.text-slate-600 { --tw-text-opacity: 1; color: rgb(71 85 105 / var(--tw-text-opacity)); }
.text-slate-700 { --tw-text-opacity: 1; color: rgb(51 65 85 / var(--tw-text-opacity)); }
.text-slate-800 { --tw-text-opacity: 1; color: rgb(30 41 59 / var(--tw-text-opacity)); }
.text-slate-900 { --tw-text-opacity: 1; color: rgb(15 23 42 / var(--tw-text-opacity)); }
.text-slate-950 { --tw-text-opacity: 1; color: rgb(2 6 23 / var(--tw-text-opacity)); }
.text-gray-50 { --tw-text-opacity: 1; color: rgb(249 250 251 / var(--tw-text-opacity)); }
.text-gray-100 { --tw-text-opacity: 1; color: rgb(243 244 246 / var(--tw-text-opacity)); }
.text-gray-200 { --tw-text-opacity: 1; color: rgb(229 231 235 / var(--tw-text-opacity)); }
.text-gray-300 { --tw-text-opacity: 1; color: rgb(209 213 219 / var(--tw-text-opacity)); }
.text-gray-400 { --tw-text-opacity: 1; color: rgb(156 163 175 / var(--tw-text-opacity)); }
.text-gray-500 { --tw-text-opacity: 1; color: rgb(107 114 128 / var(--tw-text-opacity)); }
.text-gray-600 { --tw-text-opacity: 1; color: rgb(75 85 99 / var(--tw-text-opacity)); }
.text-gray-700 { --tw-text-opacity: 1; color: rgb(55 65 81 / var(--tw-text-opacity)); }
.text-gray-800 { --tw-text-opacity: 1; color: rgb(31 41 55 / var(--tw-text-opacity)); }
.text-gray-900 { --tw-text-opacity: 1; color: rgb(17 24 39 / var(--tw-text-opacity)); }
.text-gray-950 { --tw-text-opacity: 1; color: rgb(3 7 18 / var(--tw-text-opacity)); }
.text-zinc-50 { --tw-text-opacity: 1; color: rgb(250 250 250 / var(--tw-text-opacity)); }
.text-zinc-100 { --tw-text-opacity: 1; color: rgb(244 244 245 / var(--tw-text-opacity)); }
.text-zinc-200 { --tw-text-opacity: 1; color: rgb(228 228 231 / var(--tw-text-opacity)); }
.text-zinc-300 { --tw-text-opacity: 1; color: rgb(212 212 216 / var(--tw-text-opacity)); }
.text-zinc-400 { --tw-text-opacity: 1; color: rgb(161 161 170 / var(--tw-text-opacity)); }
.text-zinc-500 { --tw-text-opacity: 1; color: rgb(113 113 122 / var(--tw-text-opacity)); }
.text-zinc-600 { --tw-text-opacity: 1; color: rgb(82 82 91 / var(--tw-text-opacity)); }
.text-zinc-700 { --tw-text-opacity: 1; color: rgb(63 63 70 / var(--tw-text-opacity)); }
.text-zinc-800 { --tw-text-opacity: 1; color: rgb(39 39 42 / var(--tw-text-opacity)); }
.text-zinc-900 { --tw-text-opacity: 1; color: rgb(24 24 27 / var(--tw-text-opacity)); }
.text-zinc-950 { --tw-text-opacity: 1; color: rgb(9 9 11 / var(--tw-text-opacity)); }
.text-neutral-50 { --tw-text-opacity: 1; color: rgb(250 250 250 / var(--tw-text-opacity)); }
.text-neutral-100 { --tw-text-opacity: 1; color: rgb(245 245 245 / var(--tw-text-opacity)); }
.text-neutral-200 { --tw-text-opacity: 1; color: rgb(229 229 229 / var(--tw-text-opacity)); }
.text-neutral-300 { --tw-text-opacity: 1; color: rgb(212 212 212 / var(--tw-text-opacity)); }
.text-neutral-400 { --tw-text-opacity: 1; color: rgb(163 163 163 / var(--tw-text-opacity)); }
.text-neutral-500 { --tw-text-opacity: 1; color: rgb(115 115 115 / var(--tw-text-opacity)); }
.text-neutral-600 { --tw-text-opacity: 1; color: rgb(82 82 82 / var(--tw-text-opacity)); }
.text-neutral-700 { --tw-text-opacity: 1; color: rgb(64 64 64 / var(--tw-text-opacity)); }
.text-neutral-800 { --tw-text-opacity: 1; color: rgb(38 38 38 / var(--tw-text-opacity)); }
.text-neutral-900 { --tw-text-opacity: 1; color: rgb(23 23 23 / var(--tw-text-opacity)); }
.text-neutral-950 { --tw-text-opacity: 1; color: rgb(10 10 10 / var(--tw-text-opacity)); }
.text-stone-50 { --tw-text-opacity: 1; color: rgb(250 250 249 / var(--tw-text-opacity)); }
.text-stone-100 { --tw-text-opacity: 1; color: rgb(245 245 244 / var(--tw-text-opacity)); }
.text-stone-200 { --tw-text-opacity: 1; color: rgb(231 229 228 / var(--tw-text-opacity)); }
.text-stone-300 { --tw-text-opacity: 1; color: rgb(214 211 209 / var(--tw-text-opacity)); }
.text-stone-400 { --tw-text-opacity: 1; color: rgb(168 162 158 / var(--tw-text-opacity)); }
.text-stone-500 { --tw-text-opacity: 1; color: rgb(120 113 108 / var(--tw-text-opacity)); }
.text-stone-600 { --tw-text-opacity: 1; color: rgb(87 83 78 / var(--tw-text-opacity)); }
.text-stone-700 { --tw-text-opacity: 1; color: rgb(68 64 60 / var(--tw-text-opacity)); }
.text-stone-800 { --tw-text-opacity: 1; color: rgb(41 37 36 / var(--tw-text-opacity)); }
.text-stone-900 { --tw-text-opacity: 1; color: rgb(28 25 23 / var(--tw-text-opacity)); }
.text-stone-950 { --tw-text-opacity: 1; color: rgb(12 10 9 / var(--tw-text-opacity)); }
.text-red-50 { --tw-text-opacity: 1; color: rgb(254 242 242 / var(--tw-text-opacity)); }
.text-red-100 { --tw-text-opacity: 1; color: rgb(254 226 226 / var(--tw-text-opacity)); }
.text-red-200 { --tw-text-opacity: 1; color: rgb(254 202 202 / var(--tw-text-opacity)); }
.text-red-300 { --tw-text-opacity: 1; color: rgb(252 165 165 / var(--tw-text-opacity)); }
.text-red-400 { --tw-text-opacity: 1; color: rgb(248 113 113 / var(--tw-text-opacity)); }
.text-red-500 { --tw-text-opacity: 1; color: rgb(239 68 68 / var(--tw-text-opacity)); }
.text-red-600 { --tw-text-opacity: 1; color: rgb(220 38 38 / var(--tw-text-opacity)); }
.text-red-700 { --tw-text-opacity: 1; color: rgb(185 28 28 / var(--tw-text-opacity)); }
.text-red-800 { --tw-text-opacity: 1; color: rgb(153 27 27 / var(--tw-text-opacity)); }
.text-red-900 { --tw-text-opacity: 1; color: rgb(127 29 29 / var(--tw-text-opacity)); }
.text-red-950 { --tw-text-opacity: 1; color: rgb(69 10 10 / var(--tw-text-opacity)); }

.bg-transparent { background-color: transparent; }
.bg-current { background-color: currentColor; }
.bg-black { --tw-bg-opacity: 1; background-color: rgb(0 0 0 / var(--tw-bg-opacity)); }
.bg-white { --tw-bg-opacity: 1; background-color: rgb(255 255 255 / var(--tw-bg-opacity)); }
.bg-slate-50 { --tw-bg-opacity: 1; background-color: rgb(248 250 252 / var(--tw-bg-opacity)); }
.bg-slate-100 { --tw-bg-opacity: 1; background-color: rgb(241 245 249 / var(--tw-bg-opacity)); }
.bg-slate-200 { --tw-bg-opacity: 1; background-color: rgb(226 232 240 / var(--tw-bg-opacity)); }
.bg-slate-300 { --tw-bg-opacity: 1; background-color: rgb(203 213 225 / var(--tw-bg-opacity)); }
.bg-slate-400 { --tw-bg-opacity: 1; background-color: rgb(148 163 184 / var(--tw-bg-opacity)); }
.bg-slate-500 { --tw-bg-opacity: 1; background-color: rgb(100 116 139 / var(--tw-bg-opacity)); }
.bg-slate-600 { --tw-bg-opacity: 1; background-color: rgb(71 85 105 / var(--tw-bg-opacity)); }
.bg-slate-700 { --tw-bg-opacity: 1; background-color: rgb(51 65 85 / var(--tw-bg-opacity)); }
.bg-slate-800 { --tw-bg-opacity: 1; background-color: rgb(30 41 59 / var(--tw-bg-opacity)); }
.bg-slate-900 { --tw-bg-opacity: 1; background-color: rgb(15 23 42 / var(--tw-bg-opacity)); }
.bg-slate-950 { --tw-bg-opacity: 1; background-color: rgb(2 6 23 / var(--tw-bg-opacity)); }

.border { border-width: 1px; }
.border-0 { border-width: 0px; }
.border-2 { border-width: 2px; }
.border-4 { border-width: 4px; }
.border-8 { border-width: 8px; }
.border-x { border-left-width: 1px; border-right-width: 1px; }
.border-y { border-top-width: 1px; border-bottom-width: 1px; }
.border-t { border-top-width: 1px; }
.border-r { border-right-width: 1px; }
.border-b { border-bottom-width: 1px; }
.border-l { border-left-width: 1px; }
.border-t-0 { border-top-width: 0px; }
.border-r-0 { border-right-width: 0px; }
.border-b-0 { border-bottom-width: 0px; }
.border-l-0 { border-left-width: 0px; }
.border-t-2 { border-top-width: 2px; }
.border-r-2 { border-right-width: 2px; }
.border-b-2 { border-bottom-width: 2px; }
.border-l-2 { border-left-width: 2px; }
.border-t-4 { border-top-width: 4px; }
.border-r-4 { border-right-width: 4px; }
.border-b-4 { border-bottom-width: 4px; }
.border-l-4 { border-left-width: 4px; }
.border-t-8 { border-top-width: 8px; }
.border-r-8 { border-right-width: 8px; }
.border-b-8 { border-bottom-width: 8px; }
.border-l-8 { border-left-width: 8px; }

.border-solid { border-style: solid; }
.border-dashed { border-style: dashed; }
.border-dotted { border-style: dotted; }
.border-double { border-style: double; }
.border-hidden { border-style: hidden; }
.border-none { border-style: none; }

.rounded-none { border-radius: 0px; }
.rounded-sm { border-radius: 0.125rem; }
.rounded { border-radius: 0.25rem; }
.rounded-md { border-radius: 0.375rem; }
.rounded-lg { border-radius: 0.5rem; }
.rounded-xl { border-radius: 0.75rem; }
.rounded-2xl { border-radius: 1rem; }
.rounded-3xl { border-radius: 1.5rem; }
.rounded-full { border-radius: 9999px; }

.cursor-auto { cursor: auto; }
.cursor-default { cursor: default; }
.cursor-pointer { cursor: pointer; }
.cursor-wait { cursor: wait; }
.cursor-text { cursor: text; }
.cursor-move { cursor: move; }
.cursor-help { cursor: help; }
.cursor-not-allowed { cursor: not-allowed; }

.tracking-tighter { letter-spacing: -0.05em; }
.tracking-tight { letter-spacing: -0.025em; }
.tracking-normal { letter-spacing: 0em; }
.tracking-wide { letter-spacing: 0.025em; }
.tracking-wider { letter-spacing: 0.05em; }
.tracking-widest { letter-spacing: 0.1em; }

.antialiased { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
.subpixel-antialiased { -webkit-font-smoothing: auto; -moz-osx-font-smoothing: auto; }

/* Container utilities */
.container {
  width: 100%;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  padding-left: 1rem;
  padding-right: 1rem;
}

/* Text muted utilities */
.text-muted-foreground {
  color: #6b7280;
}

/* Scroll margin utilities */
.scroll-m-20 {
  scroll-margin: 5rem;
}

/* Button hover states */
.btn:hover {
  background-color: #2563eb;
}

.btn-secondary:hover {
  background-color: #4b5563;
}

/* Background and foreground utilities based on CSS variables */
.bg-background { background-color: var(--background); }
.text-foreground { color: var(--foreground); }
.bg-card { background-color: var(--card); }
.text-card-foreground { color: var(--card-foreground); }
.bg-primary { background-color: var(--primary); }
.text-primary-foreground { color: var(--primary-foreground); }
.bg-secondary { background-color: var(--secondary); }
.text-secondary-foreground { color: var(--secondary-foreground); }
.bg-muted { background-color: var(--muted); }
.text-muted-foreground { color: var(--muted-foreground); }
.bg-accent { background-color: var(--accent); }
.text-accent-foreground { color: var(--accent-foreground); }
.bg-destructive { background-color: var(--destructive); }
.text-destructive-foreground { color: var(--primary-foreground); }
.border-border { border-color: var(--border); }
.bg-input { background-color: var(--input); }
.ring-ring { --tw-ring-color: var(--ring); }

/* Border radius with CSS variables */
.rounded-lg { border-radius: var(--radius-lg); }
.rounded-md { border-radius: var(--radius-md); }
.rounded-sm { border-radius: var(--radius-sm); }

/* Shadow utilities */
.shadow-sm { --tw-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); --tw-shadow-colored: 0 1px 2px 0 var(--tw-shadow-color); box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow); }
.shadow { --tw-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1); --tw-shadow-colored: 0 1px 3px 0 var(--tw-shadow-color), 0 1px 2px -1px var(--tw-shadow-color); box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow); }
.shadow-md { --tw-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); --tw-shadow-colored: 0 4px 6px -1px var(--tw-shadow-color), 0 2px 4px -2px var(--tw-shadow-color); box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow); }
.shadow-lg { --tw-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); --tw-shadow-colored: 0 10px 15px -3px var(--tw-shadow-color), 0 4px 6px -4px var(--tw-shadow-color); box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow); }
.shadow-xl { --tw-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1); --tw-shadow-colored: 0 20px 25px -5px var(--tw-shadow-color), 0 8px 10px -6px var(--tw-shadow-color); box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow); }
.shadow-2xl { --tw-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25); --tw-shadow-colored: 0 25px 50px -12px var(--tw-shadow-color); box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow); }
.shadow-inner { --tw-shadow: inset 0 2px 4px 0 rgb(0 0 0 / 0.05); --tw-shadow-colored: inset 0 2px 4px 0 var(--tw-shadow-color); box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow); }
.shadow-none { --tw-shadow: 0 0 #0000; --tw-shadow-colored: 0 0 #0000; box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow); }

/* Ring utilities for focus states */
.ring-0 { --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color); --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(0px + var(--tw-ring-offset-width)) var(--tw-ring-color); box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000); }
.ring-1 { --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color); --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color); box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000); }
.ring-2 { --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color); --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color); box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000); }
.ring-4 { --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color); --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(4px + var(--tw-ring-offset-width)) var(--tw-ring-color); box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000); }
.ring-8 { --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color); --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(8px + var(--tw-ring-offset-width)) var(--tw-ring-color); box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000); }
.ring { --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color); --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(3px + var(--tw-ring-offset-width)) var(--tw-ring-color); box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000); }

/* Ring inset */
.ring-inset { --tw-ring-inset: inset; }

/* Ring colors */
.ring-slate-200 { --tw-ring-opacity: 1; --tw-ring-color: rgb(226 232 240 / var(--tw-ring-opacity)); }
.ring-gray-200 { --tw-ring-opacity: 1; --tw-ring-color: rgb(229 231 235 / var(--tw-ring-opacity)); }
.ring-zinc-200 { --tw-ring-opacity: 1; --tw-ring-color: rgb(228 228 231 / var(--tw-ring-opacity)); }
.ring-neutral-200 { --tw-ring-opacity: 1; --tw-ring-color: rgb(229 229 229 / var(--tw-ring-opacity)); }
.ring-stone-200 { --tw-ring-opacity: 1; --tw-ring-color: rgb(231 229 228 / var(--tw-ring-opacity)); }
.ring-red-200 { --tw-ring-opacity: 1; --tw-ring-color: rgb(254 202 202 / var(--tw-ring-opacity)); }
.ring-orange-200 { --tw-ring-opacity: 1; --tw-ring-color: rgb(254 215 170 / var(--tw-ring-opacity)); }
.ring-amber-200 { --tw-ring-opacity: 1; --tw-ring-color: rgb(253 230 138 / var(--tw-ring-opacity)); }
.ring-yellow-200 { --tw-ring-opacity: 1; --tw-ring-color: rgb(254 240 138 / var(--tw-ring-opacity)); }
.ring-lime-200 { --tw-ring-opacity: 1; --tw-ring-color: rgb(217 249 157 / var(--tw-ring-opacity)); }
.ring-green-200 { --tw-ring-opacity: 1; --tw-ring-color: rgb(187 247 208 / var(--tw-ring-opacity)); }
.ring-emerald-200 { --tw-ring-opacity: 1; --tw-ring-color: rgb(167 243 208 / var(--tw-ring-opacity)); }
.ring-teal-200 { --tw-ring-opacity: 1; --tw-ring-color: rgb(153 246 228 / var(--tw-ring-opacity)); }
.ring-cyan-200 { --tw-ring-opacity: 1; --tw-ring-color: rgb(165 243 252 / var(--tw-ring-opacity)); }
.ring-sky-200 { --tw-ring-opacity: 1; --tw-ring-color: rgb(186 230 253 / var(--tw-ring-opacity)); }
.ring-blue-200 { --tw-ring-opacity: 1; --tw-ring-color: rgb(191 219 254 / var(--tw-ring-opacity)); }
.ring-indigo-200 { --tw-ring-opacity: 1; --tw-ring-color: rgb(199 210 254 / var(--tw-ring-opacity)); }
.ring-violet-200 { --tw-ring-opacity: 1; --tw-ring-color: rgb(221 214 254 / var(--tw-ring-opacity)); }
.ring-purple-200 { --tw-ring-opacity: 1; --tw-ring-color: rgb(233 213 255 / var(--tw-ring-opacity)); }
.ring-fuchsia-200 { --tw-ring-opacity: 1; --tw-ring-color: rgb(245 208 254 / var(--tw-ring-opacity)); }
.ring-pink-200 { --tw-ring-opacity: 1; --tw-ring-color: rgb(251 207 232 / var(--tw-ring-opacity)); }
.ring-rose-200 { --tw-ring-opacity: 1; --tw-ring-color: rgb(254 205 211 / var(--tw-ring-opacity)); }

/* Responsive design utilities */
@media (min-width: 640px) {
  .sm\\:px-4 { padding-left: 1rem; padding-right: 1rem; }
  .sm\\:px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
  .sm\\:py-8 { padding-top: 2rem; padding-bottom: 2rem; }
  .sm\\:text-base { font-size: 1rem; line-height: 1.5rem; }
  .sm\\:inline { display: inline; }
  .sm\\:w-auto { width: auto; }
  .sm\\:flex-row { flex-direction: row; }
  .sm\\:items-center { align-items: center; }
}

@media (min-width: 768px) {
  .lg\\:px-8 { padding-left: 2rem; padding-right: 2rem; }
  .lg\\:text-5xl { font-size: 3rem; line-height: 1; }
}

/* Focus utilities */
.focus\\:outline-none:focus { outline: 2px solid transparent; outline-offset: 2px; }
.focus\\:ring-2:focus { --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color); --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color); box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000); }
.focus\\:ring-offset-2:focus { --tw-ring-offset-width: 2px; }

/* Hover utilities */
.hover\\:bg-slate-100:hover { --tw-bg-opacity: 1; background-color: rgb(241 245 249 / var(--tw-bg-opacity)); }
.hover\\:bg-gray-100:hover { --tw-bg-opacity: 1; background-color: rgb(243 244 246 / var(--tw-bg-opacity)); }

/* Transform utilities */
.transform { transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y)); }
.transition { transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
.transition-all { transition-property: all; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
.transition-colors { transition-property: color, background-color, border-color, text-decoration-color, fill, stroke; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
.transition-opacity { transition-property: opacity; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
.transition-shadow { transition-property: box-shadow; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
.transition-transform { transition-property: transform; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }

/* Duration utilities */
.duration-150 { transition-duration: 150ms; }
.duration-200 { transition-duration: 200ms; }
.duration-300 { transition-duration: 300ms; }
.duration-500 { transition-duration: 500ms; }
.duration-700 { transition-duration: 700ms; }
.duration-1000 { transition-duration: 1000ms; }

/* Ease utilities */
.ease-in { transition-timing-function: cubic-bezier(0.4, 0, 1, 1); }
.ease-out { transition-timing-function: cubic-bezier(0, 0, 0.2, 1); }
.ease-in-out { transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }

/* Position utilities */
.top-0 { top: 0px; }
.right-0 { right: 0px; }
.bottom-0 { bottom: 0px; }
.left-0 { left: 0px; }

/* Z-index utilities */
.z-0 { z-index: 0; }
.z-10 { z-index: 10; }
.z-20 { z-index: 20; }
.z-30 { z-index: 30; }
.z-40 { z-index: 40; }
.z-50 { z-index: 50; }

/* Opacity utilities */
.opacity-0 { opacity: 0; }
.opacity-5 { opacity: 0.05; }
.opacity-10 { opacity: 0.1; }
.opacity-20 { opacity: 0.2; }
.opacity-25 { opacity: 0.25; }
.opacity-30 { opacity: 0.3; }
.opacity-40 { opacity: 0.4; }
.opacity-50 { opacity: 0.5; }
.opacity-60 { opacity: 0.6; }
.opacity-70 { opacity: 0.7; }
.opacity-75 { opacity: 0.75; }
.opacity-80 { opacity: 0.8; }
.opacity-90 { opacity: 0.9; }
.opacity-95 { opacity: 0.95; }
.opacity-100 { opacity: 1; }

/* Overflow utilities */
.overflow-auto { overflow: auto; }
.overflow-hidden { overflow: hidden; }
.overflow-visible { overflow: visible; }
.overflow-scroll { overflow: scroll; }
.overflow-x-auto { overflow-x: auto; }
.overflow-y-auto { overflow-y: auto; }
.overflow-x-hidden { overflow-x: hidden; }
.overflow-y-hidden { overflow-y: hidden; }
.overflow-x-visible { overflow-x: visible; }
.overflow-y-visible { overflow-y: visible; }
.overflow-x-scroll { overflow-x: scroll; }
.overflow-y-scroll { overflow-y: scroll; }

/* Selection utilities */
.select-none { -webkit-user-select: none; -moz-user-select: none; user-select: none; }
.select-text { -webkit-user-select: text; -moz-user-select: text; user-select: text; }
.select-all { -webkit-user-select: all; -moz-user-select: all; user-select: all; }
.select-auto { -webkit-user-select: auto; -moz-user-select: auto; user-select: auto; }

/* Pointer events utilities */
.pointer-events-none { pointer-events: none; }
.pointer-events-auto { pointer-events: auto; }

/* Resize utilities */
.resize-none { resize: none; }
.resize-y { resize: vertical; }
.resize-x { resize: horizontal; }
.resize { resize: both; }

/* User select utilities */
.user-select-none { -webkit-user-select: none; -moz-user-select: none; user-select: none; }
.user-select-text { -webkit-user-select: text; -moz-user-select: text; user-select: text; }
.user-select-all { -webkit-user-select: all; -moz-user-select: all; user-select: all; }
.user-select-auto { -webkit-user-select: auto; -moz-user-select: auto; user-select: auto; }
        `;

        processedCSS = processedCSS.replace('@import "tailwindcss";', tailwindBase);
      }

      // @import "tw-animate-css" 제거 (애니메이션은 일단 제외)
      if (processedCSS.includes('@import "tw-animate-css";')) {
        processedCSS = processedCSS.replace('@import "tw-animate-css";', '');
      }

      return {
        contents: `export default ${JSON.stringify(processedCSS)}`,
        loader: 'js'
      };
    });
  }
};

async function build() {
  try {
    console.log('React renderer with existing components 빌드 시작...');

    // React 앱 번들링 (기존 컴포넌트들과 함께)
    await esbuild.build({
      entryPoints: ['electron/renderer/index.tsx'],
      bundle: true,
      outfile: 'dist-electron/bundle.js',
      format: 'iife',
      target: 'es2020',
      platform: 'browser',
      jsx: 'automatic',
      jsxImportSource: 'react',
      external: [],
      define: {
        'process.env.NODE_ENV': '"production"'
      },
      minify: true,
      plugins: [tailwindPlugin],
      alias: {
        '@': './src'
      },
      loader: {
        '.png': 'dataurl',
        '.jpg': 'dataurl',
        '.jpeg': 'dataurl',
        '.svg': 'dataurl'
      }
    });

    // HTML 템플릿 읽기
    let htmlTemplate = fs.readFileSync('electron/renderer/template.html', 'utf-8');

    // HTML 파일을 dist-electron에 복사
    fs.writeFileSync('dist-electron/renderer.html', htmlTemplate);

    console.log('React renderer 빌드 완료 (기존 컴포넌트 활용)');
  } catch (error) {
    console.error('빌드 실패:', error);
    process.exit(1);
  }
}

build();