export type ServiceItem = {
  name: string;
  username: string;
  body: string;
  img: string;
};

export const servicesData: ServiceItem[] = [
  {
    name: "PSD to HTML",
    username: "@psdtohtml",
    body: "We convert your beautiful PSD designs into fully responsive, pixel-perfect HTML code.",
    img: "/Service/Adobe_Photoshop.svg",
  },
  {
    name: "Figma to HTML",
    username: "@figmatohtml",
    body: "We turn your Figma designs into clean, responsive HTML code.",
    img: "/Service/figma.svg",
  },
  {
    name: "Thumbnail or Post Design",
    username: "@thumbnaildesign",
    body: "Custom thumbnail and post designs for social media, YouTube, and websites.",
    img: "/Service/gimp.svg",
  },
  {
    name: "Website from Your Mind",
    username: "@websitefromyourmind",
    body: "Transform your ideas into stunning, fully-functional websites.",
    img: "/Service/wordpress.svg",
  },
  {
    name: "MERN Stack Developer",
    username: "@mernstackdev",
    body: "We build full-stack web applications using MongoDB, Express, React, and Node.js.",
    img: "/Service/react.svg",
  },
  {
    name: "Full Stack Developer",
    username: "@fullstackdev",
    body: "Front-end and back-end development for complete web solutions.",
    img: "/Service/node.svg",
  },
  {
    name: "XD to HTML Conversion",
    username: "@xdtohtml",
    body: "Adobe XD design converted into responsive HTML pages.",
    img: "/Service/figma.svg",
  },
  {
    name: "Social Media Post Design",
    username: "@postdesign",
    body: "Eye-catching social media post designs for better online presence.",
    img: "/Service/gimp.svg",
  },
];
