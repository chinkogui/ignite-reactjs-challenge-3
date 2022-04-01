import { toast } from "react-toastify";

export function showMessageError(message: string) {
    toast.error(message);
}

export function showMessageSuccess(message: string) {
    toast.success(message);
}
