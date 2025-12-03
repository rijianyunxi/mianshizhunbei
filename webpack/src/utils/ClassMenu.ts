

class BaseMenu {
    title: string;
    icon: string;
    constructor(title: string, icon: string) {
        this.title = title;
        this.icon = icon
    }
    exec() {
        console.log('BaseMenu exec');

    }
}

class Button extends BaseMenu {
    type: number;
    constructor(title: string, icon: string, type: number) {
        super(title, icon)
        this.type = type;
    }
    exec() {
        console.log('Button exec' + this.type);

    }
}



export default Button;



