import slugify from 'slugify';

const options = {
  remove: /[*+~.()'"!:@]/g,
  lower: true,
  strict: true,
  locale: 'is',
};

function slugifyIcelandic(str: string): string {
  return slugify(str, options);
}

export default slugifyIcelandic;
