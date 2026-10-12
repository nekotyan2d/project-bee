const SAVE_ERROR = "Не удалось сохранить. Попробуйте ещё раз.";

export function useFormSubmit() {
    const { show } = useToast();
    const submitting = ref(false);
    const error = ref<string | null>(null);

    async function run(save: () => Promise<void>, done?: string): Promise<boolean> {
        submitting.value = true;
        error.value = null;
        try {
            await save();
            if (done) show(done);
            return true;
        } catch {
            error.value = SAVE_ERROR;
            submitting.value = false;
            return false;
        }
    }

    return { submitting, error, run };
}
