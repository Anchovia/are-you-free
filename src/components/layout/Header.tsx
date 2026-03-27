import Button from "../common/Button";

export default function Header({
    dialogRef,
}: {
    dialogRef: React.RefObject<HTMLDialogElement | null>;
}) {
    return (
        <header className="p-4 border-b bg-white flex justify-between items-center border-white shadow-sm">
            <h1>너 시간 돼?</h1>
            <nav className="flex gap-4">
                <Button
                    text="시간표 추가하기"
                    onClick={() => dialogRef.current?.showModal()}
                />
            </nav>
        </header>
    );
}
