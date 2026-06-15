export default defineNuxtRouteMiddleware(async (to) => {
    if (!import.meta.client) return;
    if (to.path === "/onboarding") return;

    const db = useDb();
    const count = await db.apiary.count();
    if (count === 0) {
        return navigateTo("/onboarding");
    }
});
