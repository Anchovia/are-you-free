type ButtonColor = "default" | "accent" | "green";

interface ButtonProps {
    htmlFor?: string;
    text: string;
    buttonColor?: ButtonColor;
    onClick?: () => void;
    type?: "button" | "submit" | "reset";
}

// variant 별로 적용될 Tailwind 클래스 맵핑
const buttonStyles: Record<ButtonColor, string> = {
    default: "bg-blue-500 text-white",
    accent: "bg-red-500 text-white",
    green: "bg-lime-500 text-white",
};

export default function Button({
    htmlFor,
    text,
    onClick,
    buttonColor = "default",
    type = "button",
}: ButtonProps) {
    const commonStyle =
        "flex-1 flex-none text-center px-4 py-2 rounded-lg text-sm font-bold cursor-pointer transition-colors";
    return htmlFor ? (
        <label
            htmlFor={htmlFor}
            className={`${buttonStyles[buttonColor]} ${commonStyle}`}
        >
            {text}
        </label>
    ) : (
        <button
            type={type}
            onClick={onClick}
            className={`${buttonStyles[buttonColor]} ${commonStyle}`}
        >
            {text}
        </button>
    );
}
