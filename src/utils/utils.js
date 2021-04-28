export default {
	stringtoHub(name) {
		return name.replace(/\_([a-z])/g, (all, letter) => {
			return letter.toUpperCase();
		});
	},
	toHubFirst(str) {
		return str.substring(0, 1).toLocaleUpperCase() + str.substring(1);
	},
	downLoadObjectForJava(detail) {
		let arrays = [];
		arrays.push(`
			/**
			 * ${detail.description}
			 */
			public class ${detail.name} {
			`);
		detail.attributes.forEach(item => {
			let component = item.component ? `<${item.component}>` : '';
			let name = this.stringtoHub(item.name);
			let isBoolean = item.type == 'Boolean';
			let type = isBoolean ? item.type.toLowerCase() : item.type;
			arrays.push(`
				/**${item.description}*/
				private ${type}${component} m_${this.toHubFirst(name)};`);
		});
		detail.attributes.forEach(item => {
			let component = item.component ? `<${item.component}>` : '';
			let name = this.stringtoHub(item.name);
			let isBoolean = item.type == 'Boolean';
			let get = isBoolean ? 'is' : 'get';
			let type = isBoolean ? item.type.toLowerCase() : item.type;

			arrays.push(
				`
					/**
					 * 取得${item.description}
					 * @return ${item.description}
					 */
					public ${type}${component} ${get}${this.toHubFirst(name)}(){
						return m_${this.toHubFirst(name)};
					}
				`
			);
			arrays.push(
				`
					/**
					 * 设置${item.description}
					 * @param ${name} ${item.description}
					 */
					public void set${this.toHubFirst(name)}(${type}${component} ${name}){
						m_${this.toHubFirst(name)} = ${name};
					}
				`
			);
		});
		arrays.push(`
			}
			`);
		this.createDownload(detail.name + '.java', arrays.join('\n'));
	},
	createDownload(fileName, content) {
		var blob = new Blob([content], {
			type: 'text/plain'
		});
		var link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = fileName;
		link.click();
	}
}
