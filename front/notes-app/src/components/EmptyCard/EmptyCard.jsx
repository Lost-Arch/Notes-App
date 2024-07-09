import React from 'react'

const EmptyCard = ({imgSrc, message}) => {
  return (
    <div>
      <div className="flex items-center justify-center flex-col mt-28">
        <img src={imgSrc} alt="No Notes" className='w-60' />
        <p className="w-1/2 text-sm font-medium text-slate-700 text-center leading-7 mt-5">{message}</p>
      </div>
    </div>
  )
}

export default EmptyCard