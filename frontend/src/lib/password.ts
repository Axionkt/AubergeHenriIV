interface Rule {
  label: string;
  test: (pw: string) => boolean;
}

export const RULES: Rule[] = [
  { label: "Au moins 10 caractères", test: (pw) => pw.length >= 10 },
  { label: "Une lettre majuscule", test: (pw) => /[A-Z]/.test(pw) },
  { label: "Une lettre minuscule", test: (pw) => /[a-z]/.test(pw) },
  { label: "Un chiffre", test: (pw) => /[0-9]/.test(pw) },
  {
    label: "Un caractère spécial (!@#$…)",
    test: (pw) => /[^A-Za-z0-9]/.test(pw),
  },
  { label: "Pas d'espace", test: (pw) => !/\s/.test(pw) },
];
