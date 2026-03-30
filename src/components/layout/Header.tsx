import { FaGithub } from "react-icons/fa";
import { FiCalendar } from "react-icons/fi";
import Button from "../common/Button";

interface HeaderProps {
    dialogRef: React.RefObject<HTMLDialogElement | null>;
    onReset: () => void;
}

export default function Header({ onReset }: HeaderProps) {
    return (
        <header className="p-3 lg:p-4 border-b bg-white border-white shadow-sm ">
            <div className="flex justify-between items-center mx-auto w-full lg:max-w-2/3">
                <span className="flex items-center gap-2">
                    <FiCalendar className="size-9 p-2 bg-blue-100 rounded-2xl text-blue-500" />
                    <h1>너 시간 돼?</h1>
                </span>
                <nav className="flex gap-3  items-center">
                    <a href="https://github.com/Anchovia/are-you-free">
                        <FaGithub className="size-8 text-gray-700" />
                    </a>
                    <Button
                        text="모든 데이터 초기화"
                        type="button"
                        buttonColor="red"
                        onClick={onReset}
                    />
                </nav>
            </div>
        </header>
    );
}
