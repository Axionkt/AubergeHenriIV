import styles from "./Admin.module.css";
import CommonSpacesMediaSection, {
  CommonMediaContext,
} from "./CommonSpacesMediaSection";

const SECTIONS: {
  title: string;
  mediaContext: CommonMediaContext;
  listUrl: string;
}[] = [
  {
    title: "Appartements",
    mediaContext: "apartment-common",
    listUrl: "/admin/apartments/common-space/media",
  },
  {
    title: "Espaces pro",
    mediaContext: "pro-space-common",
    listUrl: "/admin/pro-spaces/common-space/media",
  },
];

export default function CommonSpacesPanel() {
  return (
    <>
      <div className={styles.panelHead}>
        <div>
          <p className="section-eyebrow">Administration</p>
          <h2>Espaces communs</h2>
        </div>
      </div>

      {SECTIONS.map((section) => (
        <CommonSpacesMediaSection key={section.mediaContext} {...section} />
      ))}
    </>
  );
}
