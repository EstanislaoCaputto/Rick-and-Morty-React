import { useContext } from "react"
import UserContext from "../context/UserContext"

const Pagination = () => {
  const {info, onPrevious, onNext} = useContext(UserContext)
    const handlePrev = () => {onPrevious()}
    const handleNext = () => {onNext()}
    return (
      <nav>
        <ul className="pagination justify-content-center mt-3">
          {info.prev ? (
            <li className="page-item">
              <button className="page-link" onClick={handlePrev}>
                Prev
              </button>
            </li>
          ) : null}
          {info.next ? (
            <li className="page-item">
            <button className="page-link" onClick={handleNext}>
              Next
            </button>
          </li>
          ) : null}
        </ul>
      </nav>
    );
}

export default Pagination