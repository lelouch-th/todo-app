import random

HANDS = {"グー": 0, "チョキ": 1, "パー": 2}
HAND_NAMES = list(HANDS.keys())

def get_result(player, computer):
    diff = (HANDS[player] - HANDS[computer]) % 3
    if diff == 0:
        return "引き分け"
    elif diff == 1:
        return "あなたの勝ち"
    else:
        return "あなたの負け"

def main():
    print("=== じゃんけんゲーム ===")
    wins = losses = draws = 0

    while True:
        print("\n手を選んでください: 1=グー, 2=チョキ, 3=パー, 0=終了")
        choice = input("> ").strip()

        if choice == "0":
            break
        if choice not in ("1", "2", "3"):
            print("1〜3、または0を入力してください")
            continue

        player = HAND_NAMES[int(choice) - 1]
        computer = random.choice(HAND_NAMES)

        print(f"あなた: {player}  コンピュータ: {computer}")
        result = get_result(player, computer)
        print(f"→ {result}")

        if result == "あなたの勝ち":
            wins += 1
        elif result == "あなたの負け":
            losses += 1
        else:
            draws += 1

    print(f"\n=== 結果 ===")
    print(f"勝ち: {wins}  負け: {losses}  引き分け: {draws}")

if __name__ == "__main__":
    main()
