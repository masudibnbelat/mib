import { useTheme } from "@/src/providers/ThemeProvider";

const DayNightToggle = ({ size = 60, animationSpeed = 0.7 }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div>
      <style>
        {`
        .sky {
          background-color: #357bb3;
          height: ${size}px;
          aspect-ratio: 2.542;
          border-radius: 9999px;
          position: relative;
          overflow: hidden;
          transition: all ease-in-out ${animationSpeed}s;
          display: block;
          cursor: pointer;
        }

        .sky::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 9999px;
          box-shadow: 0px 2.226px 2.862px 0px rgba(0, 0, 0, 0.25) inset,
                      0px -0.318px 4.134px 0px rgba(0, 0, 0, 0.25) inset,
                      0px -0.954px 1.272px 0px rgba(0, 0, 0, 0.25);
          z-index: 9999;
        }

        #sun_wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          aspect-ratio: 1;
          position: relative;
          z-index: 10;
          margin-left: 0.45%;
          transition: all ease-in-out ${animationSpeed}s;
        }

        #sun {
          background-color: #ffd700;
          height: 83%;
          aspect-ratio: 1;
          border-radius: 9999px;
          box-shadow: 0 0 2px rgba(255, 215, 0, 0.5);
          position: absolute;
          z-index: 20;
          box-shadow: 0.6px 0.8px 0.8px 0px rgba(254, 255, 239, 0.61) inset,
                      0px -1px 0.8px 0px #ba9b2e inset;
          overflow: hidden;
        }

        #sun_wrapper .ray {
          background-color: #fff;
          height: 260%;
          aspect-ratio: 1;
          border-radius: 9999px;
          position: absolute;
          opacity: 0.1;
        }

        #sun_wrapper .ray:nth-child(1) {
          height: 198%;
        }

        #sun_wrapper .ray:nth-child(2) {
          height: 140%;
        }

        #moon {
          background-color: rgb(195, 201, 209);
          height: 100%;
          aspect-ratio: 1;
          border-radius: 9999px;
          z-index: -11;
          position: relative;
          box-shadow: 0.6px 0.8px 0.8px 0px rgba(255, 255, 255, 0.61) inset,
                      0px -1px 0.8px 0px #969696 inset;
          transform: translateX(100%);
          transition: all ease-in-out ${animationSpeed}s;
        }

        #moon .spot {
          background: rgb(148, 158, 178);
          height: 10%;
          aspect-ratio: 1;
          border-radius: 99999px;
          position: absolute;
          box-shadow: 0px 0.2px 0.8px 0px rgba(0, 0, 0, 0.25) inset;
        }

        #moon .spot:nth-child(1) {
          top: 40%;
          left: 17%;
          height: 37%;
        }

        #moon .spot:nth-child(2) {
          top: 20%;
          left: 45%;
          height: 13%;
        }

        #moon .spot:nth-child(3) {
          top: 50%;
          left: 64%;
          height: 22%;
        }

        .cloud_wrapper {
          background-color: transparent;
          position: absolute;
          top: 0;
          right: 0;
          height: 100%;
          width: 100%;
          display: flex;
          align-items: flex-end;
          z-index: 10;
          transition: all ease-in-out ${animationSpeed}s;
        }

        .cloud_wrapper:nth-of-type(2) {
          transform: translateY(-5%) translateX(-5.5%);
          opacity: 0.6;
        }

        .cloud {
          background-color: rgb(243, 253, 255);
          height: 55%;
          aspect-ratio: 1;
          border-radius: 9999px;
          position: absolute;
        }

        .cloud_wrapper:nth-of-type(2) .cloud:nth-child(1) {
          margin-left: 77%;
          margin-bottom: 16%;
          height: 81%;
        }
        .cloud_wrapper:nth-of-type(2) .cloud:nth-child(2) {
          margin-left: 81%;
          margin-bottom: 1%;
        }
        .cloud_wrapper:nth-of-type(2) .cloud:nth-child(3) {
          margin-left: 66%;
          margin-bottom: -4%;
        }
        .cloud_wrapper:nth-of-type(2) .cloud:nth-child(4) {
          margin-left: 57%;
          margin-bottom: -9%;
        }
        .cloud_wrapper:nth-of-type(2) .cloud:nth-child(5) {
          margin-left: 46%;
          margin-bottom: -9.5%;
        }
        .cloud_wrapper:nth-of-type(2) .cloud:nth-child(6) {
          margin-left: 33%;
          margin-bottom: -14.5%;
        }
        .cloud_wrapper:nth-of-type(2) .cloud:nth-child(7) {
          margin-left: 23%;
          margin-bottom: -16%;
        }
        .cloud_wrapper:nth-of-type(2) .cloud:nth-child(8) {
          margin-left: 7%;
          margin-bottom: -14%;
        }

        .cloud_wrapper:nth-of-type(3) .cloud:nth-child(1) {
          margin-left: 84%;
          margin-bottom: 15%;
          height: 81%;
        }
        .cloud_wrapper:nth-of-type(3) .cloud:nth-child(2) {
          margin-left: 84%;
          margin-bottom: -2%;
        }
        .cloud_wrapper:nth-of-type(3) .cloud:nth-child(3) {
          margin-left: 67%;
          margin-bottom: -9.5%;
        }
        .cloud_wrapper:nth-of-type(3) .cloud:nth-child(4) {
          margin-left: 58%;
          margin-bottom: -15%;
        }
        .cloud_wrapper:nth-of-type(3) .cloud:nth-child(5) {
          margin-left: 46%;
          margin-bottom: -11%;
        }
        .cloud_wrapper:nth-of-type(3) .cloud:nth-child(6) {
          margin-left: 33%;
          margin-bottom: -14%;
        }
        .cloud_wrapper:nth-of-type(3) .cloud:nth-child(7) {
          margin-left: 21%;
          margin-bottom: -16%;
        }
        .cloud_wrapper:nth-of-type(3) .cloud:nth-child(8) {
          margin-left: 5%;
          margin-bottom: -14%;
        }

        #stars {
          width: 100%;
          height: 100%;
          background-color: inherit;
          position: absolute;
          border-radius: 99999px;
          display: flex;
          justify-content: flex-start;
          gap: 1.2%;
          padding-left: 8%;
          align-items: center;
          top: 0;
          transform: translateY(-100%);
          transition: transform ease-in-out ${animationSpeed}s;
        }

        #stars .star {
          position: relative;
          height: 10%;
          aspect-ratio: 1;
          border-radius: 100%;
          overflow: hidden;
          background-color: inherit;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        #stars .star:nth-child(1) {
          transform: scale(0.6);
          margin-bottom: 10%;
        }
        #stars .star:nth-child(2) {
          transform: scale(0.5);
          margin-bottom: -15%;
        }
        #stars .star:nth-child(3) {
          transform: scale(0.3);
          margin-bottom: -1%;
        }
        #stars .star:nth-child(4) {
          transform: scale(1.2);
          margin-bottom: 20%;
        }
        #stars .star:nth-child(5) {
          transform: scale(0.6);
          margin-bottom: 8%;
          margin-left: 3%;
        }
        #stars .star:nth-child(6) {
          transform: scale(0.6);
          margin-bottom: -17%;
          margin-left: -3%;
        }
        #stars .star:nth-child(7) {
          transform: scale(0.3);
          margin-bottom: -2%;
        }
        #stars .star:nth-child(8) {
          transform: scale(1.4);
          margin-bottom: -19%;
          margin-left: 2%;
        }
        #stars .star:nth-child(9) {
          transform: scale(0.8);
          margin-bottom: 3%;
          margin-left: -2%;
        }

        #stars .star .ray {
          background-color: inherit;
          height: 100%;
          aspect-ratio: 1;
          border-radius: 100%;
          position: absolute;
        }

        #stars .star .base {
          background-color: white;
          height: 95%;
          aspect-ratio: 1;
          border-radius: 100%;
          position: absolute;
        }

        #stars .star .ray:nth-child(2) {
          transform: translateX(70%);
        }
        #stars .star .ray:nth-child(3) {
          transform: translateX(-70%);
        }
        #stars .star .ray:nth-child(4) {
          transform: translateY(70%);
        }
        #stars .star .ray:nth-child(5) {
          transform: translateY(-70%);
        }

        input[type="checkbox"] {
          display: none;
        }

        #checkbox:checked + .sky {
          background: #1c1f2c;
        }

        #checkbox:checked + .sky .cloud_wrapper {
          transform: translateY(130%);
        }

        #checkbox:checked + .sky .cloud_wrapper:nth-of-type(2) {
          transform: translate(20%, 130%);
        }

        #checkbox:checked + .sky #sun_wrapper {
          transform: translateX(152.1%);
        }

        #checkbox:checked + .sky #moon {
          transform: translateX(0%);
        }

        #checkbox:checked + .sky #stars {
          transform: unset;
        }
      `}
      </style>
      <input
        id="checkbox"
        type="checkbox"
        checked={theme === "dark"}
        onChange={toggleTheme}
      />
      <label htmlFor="checkbox" className="sky">
        <div id="sun_wrapper">
          <div className="ray"></div>
          <div className="ray"></div>
          <div className="ray"></div>
          <div id="sun">
            <div id="moon">
              <div className="spot"></div>
              <div className="spot"></div>
              <div className="spot"></div>
            </div>
          </div>
        </div>
        <div className="cloud_wrapper">
          <div className="cloud"></div>
          <div className="cloud"></div>
          <div className="cloud"></div>
          <div className="cloud"></div>
          <div className="cloud"></div>
          <div className="cloud"></div>
          <div className="cloud"></div>
          <div className="cloud"></div>
        </div>
        <div className="cloud_wrapper">
          <div className="cloud"></div>
          <div className="cloud"></div>
          <div className="cloud"></div>
          <div className="cloud"></div>
          <div className="cloud"></div>
          <div className="cloud"></div>
          <div className="cloud"></div>
          <div className="cloud"></div>
        </div>
        <div id="stars">
          {[...Array(9)].map((_, i) => (
            <div className="star" key={`star-${i}`}>
              <div className="base"></div>
              <div className="ray"></div>
              <div className="ray"></div>
              <div className="ray"></div>
              <div className="ray"></div>
            </div>
          ))}
        </div>
      </label>
    </div>
  );
};

export default DayNightToggle;
