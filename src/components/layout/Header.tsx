import Button from "../common/Button";

export default function Header({
    dialogRef,
}: {
    dialogRef: React.RefObject<HTMLDialogElement>;
}) {
    return (
        <header className="p-4 border-b bg-white flex justify-between items-center border-white shadow-sm">
            <h1>너 시간 돼?</h1>
            <Button
                text="HTML 데이터 넣기"
                onClick={() => dialogRef.current?.showModal()}
            />
        </header>
    );
}
