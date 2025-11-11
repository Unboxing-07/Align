export const Loading = () => {
  return (
    <div className="w-full min-h-screen flex justify-center items-center bg-gray-50">
      <div className="relative w-[73px] h-[73px]">
        {[1, 2, 3, 4, 5, 6].map((num) => (
          <div
            key={num}
            className="absolute top-0 left-0 w-[73px] h-[73px] animate-spinner-fade"
            style={{
              animationDelay: `${(num - 1) * 166.67}ms`,
            }}
          >
            <img
              src={`/piece/piece=${num}.svg`}
              alt={`piece ${num}`}
              className="w-full h-full block"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
