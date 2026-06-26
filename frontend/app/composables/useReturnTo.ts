export async function returnTo(path: string): Promise<void> {
    const back = import.meta.client ? (window.history.state as { back?: string | null } | null)?.back : undefined;
    if (back === path) {
        useRouter().back();
        return;
    }
    await navigateTo(path, { replace: true });
}
