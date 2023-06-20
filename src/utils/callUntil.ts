export default async function callUntil<T>(
  toCall: () => void,
  until: Promise<T> | (() => Promise<T>),
  interval = 5000
) {
  const timer = setInterval(toCall, interval);
  toCall();

  return (typeof until === "function" ? until() : until).then((result) => {
    clearInterval(timer);
    return result;
  });
}