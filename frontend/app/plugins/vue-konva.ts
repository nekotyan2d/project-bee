import VueKonva from "vue-konva";

export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.vueApp.use(VueKonva);
    // vue-konva reads events via $attrs but doesn't declare `emits`,
    // causing spurious Vue warnings. Patch only the component we bind events on.
    const Group = nuxtApp.vueApp.component("VGroup") as Record<string, unknown> | undefined;
    if (Group) Group.emits = ["dragstart", "dragmove", "dragend", "click", "tap"];
});
