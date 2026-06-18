type StudentLoadingProps = {
  message?: string;
};

export default function StudentLoading({
  message = "Đang tải dữ liệu...",
}: StudentLoadingProps) {
  return <div className="p-6 text-center">{message}</div>;
}