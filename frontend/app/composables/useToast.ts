const DURATION_MS = 2500;

let timer: ReturnType<typeof setTimeout> | undefined;

export function useToast() {
    const message = useState<string | null>("toast", () => null);

    function show(text: string): void {
        message.value = text;
        clearTimeout(timer);
        timer = setTimeout(() => {
            message.value = null;
        }, DURATION_MS);
    }

    return { message, show };
}
